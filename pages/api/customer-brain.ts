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
  
  // 1. זיהוי ID ראשוני (IP או טלפון מהמערכת)
  const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'guest';
  let clientId = senderPhone?.replace('@c.us', '') || userIP;

  // 2. מנגנון נעילת טלפון: אם המשתמש כתב מספר טלפון בהודעה, ה-clientId הופך להיות הטלפון הזה!
  const phoneMatch = cleanMsg.match(/05\d-?\d{7}/);
  if (phoneMatch) {
    clientId = phoneMatch[0].replace(/-/g, '');
  }
  
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  let currentUserName = "אורח";
  let chatHistory = "";

  try {
    // 3. שליפת זיכרון לפי ה-clientId המעודכן
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', clientId).maybeSingle();
    
    if (memory) {
      currentUserName = memory.user_name || "אורח";
      chatHistory = memory.accumulated_knowledge || "";
    }

    // 4. חילוץ שם אגרסיבי אם המשתמש הציג את עצמו
    if (cleanMsg.includes("השם שלי") || cleanMsg.includes("קוראים לי") || cleanMsg.includes("אני אבי")) {
       const namePart = cleanMsg.split(/השם שלי|קוראים לי|אני/i).pop() || "";
       const extracted = namePart.split(/[0-9]| /)[1]?.trim();
       if (extracted && extracted.length > 1) currentUserName = extracted;
    }

    const prompt = `
      זהות: מנהל לוגיסטי בח.סבן. 
      לקוח: ${currentUserName}.
      הקשר: ${chatHistory.slice(-1500)}
      
      חוקים:
      - אם ידוע לך השם (${currentUserName} אינו "אורח"), פנה אליו בשמו בכל תשובה!
      - אל תשאל "איך אני יכול לעזור" אם הוא כבר ביקש משהו (כמו מכולה).
      - פקודות: SET_USER_NAME:[שם], CLIENT_NOTE:[הערה].
      
      הודעה: "${cleanMsg}"
    `;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(20000)
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // 5. עיבוד פקודות מה-AI
    const nameMatch = replyText.match(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/i);
    const updatedName = nameMatch ? nameMatch[1].replace(/[\[\]\(\):]/g, "").trim() : currentUserName;

    // 6. שמירה ל-DB - המפתח לזיכרון
    const newEntry = `\n[${new Date().toLocaleTimeString('he-IL')}] U: ${cleanMsg} | AI: ${replyText.slice(0, 200)}`;
    
    await supabase.from('customer_memory').upsert({
      clientId: clientId, 
      user_name: updatedName, 
      accumulated_knowledge: (chatHistory + newEntry).slice(-3000), // הגדלנו זיכרון
      updated_at: new Date().toISOString()
    }, { onConflict: 'clientId' });

    let finalReply = replyText
      .replace(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/CLIENT_NOTE[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/SAVE_ORDER_DB[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/[\[\]\(\)]/g, "")
      .trim();

    return res.status(200).json({ reply: finalReply || `אהלן ${updatedName}, בודק לך את המכולה.` });

  } catch (error) {
    console.error("Critical Error:", error);
    return res.status(200).json({ 
      reply: currentUserName !== "אורח" 
        ? `אבי אחי, אני בודק את ההזמנה לויצמן וחוזר אליך.` 
        : "ההודעה התקבלה, בודק ומעדכן אותך." 
    });
  }
}
