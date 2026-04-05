import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-2.0-flash"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'guest';
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  // 1. שליפת זיכרון ראשונית (מחוץ ל-try כדי שתמיד נדע מי זה רפי)
  const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
  let currentUserName = memory?.user_name || "אורח";
  const chatHistory = memory?.accumulated_knowledge || "";

  try {
    const prompt = `
      זהות: מנהל הזמנות בח.סבן. לקוח: ${currentUserName}.
      הקשר: ${chatHistory.slice(-1000)}
      הודעה: "${cleanMsg}"
      משימה: ענה אישית (השתמש בשם אם ידוע). אם זה רפי סויסה, שאל על הגבס/פריימר.
      פקודות חובה בסוף: SET_USER_NAME:[שם], SAVE_ORDER_DB:[פריט], CLIENT_NOTE:[הערה].
    `;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(20000) // הגדלנו ל-20 שניות לחישובים מורכבים
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // 2. עדכון שם (SET_USER_NAME) - זיהוי חכם
    const nameMatch = replyText.match(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/i);
    const updatedName = nameMatch ? nameMatch[1].replace(/[\[\]\(\):]/g, "").trim() : currentUserName;

    // 3. הזרקה ללוח הזמנות
    if (replyText.includes("SAVE_ORDER_DB") || cleanMsg.includes("מכולה")) {
      const clientNote = replyText.match(/CLIENT_NOTE[:\(\[].*?(\]|\)|$|\n)/i)?.[1] || "";
      await supabase.from('orders').insert([{
        client_info: `שם: ${updatedName} | טלפון: ${phone}`,
        warehouse: cleanMsg,
        status: 'pending',
        has_new_note: !!clientNote,
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    // 4. עדכון הזיכרון (עם הגנה על השם)
    const memoryEntry = `\n[${new Date().toLocaleDateString('he-IL')}] U: ${cleanMsg} | AI: ${replyText.slice(0, 200)}`;
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: updatedName, 
      accumulated_knowledge: (chatHistory + memoryEntry).slice(-2500)
    }, { onConflict: 'clientId' });

    // 5. ניקוי תשובה ללקוח
    let finalReply = replyText
      .replace(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/CLIENT_NOTE[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/SAVE_ORDER_DB[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/[\[\]\(\)]/g, "")
      .trim();

    return res.status(200).json({ reply: finalReply || `אהלן ${updatedName}, אני בודק לך את זה.` });

  } catch (error) {
    // הגנה: גם אם ה-AI נפל, נחזיר תשובה שמשתמשת בשם של רפי מהזיכרון ששלפנו קודם
    console.error("Build error or timeout:", error);
    return res.status(200).json({ 
      reply: currentUserName !== "אורח" 
        ? `אחי ${currentUserName}, יש לי עומס קטן על המערכת. אני בודק את זה וחוזר אליך.` 
        : "קיבלתי, בודק ומעדכן אותך מיד." 
    });
  }
}
