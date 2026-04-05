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
  // זיהוי לפי טלפון (הכי אמין) או IP כגיבוי
  const phone = senderPhone?.replace('@c.us', '') || req.headers['x-forwarded-for'] || 'guest';
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  try {
    // 1. שליפת זיכרון לקוח + הזמנה אחרונה (לצורך "רמז" מהעבר)
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    const { data: lastOrder } = await supabase.from('orders')
      .select('*')
      .ilike('client_info', `%${phone}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const currentUserName = memory?.user_name || "אורח";
    const chatHistory = memory?.accumulated_knowledge || "";
    
    // בניית "הקשר אישי" עבור ה-Gem
    let personalContext = `שם הלקוח: ${currentUserName}.`;
    if (lastOrder) {
      personalContext += ` הזמנה אחרונה: ${lastOrder.warehouse} בתאריך ${new Date(lastOrder.created_at).toLocaleDateString('he-IL')}.`;
    }

    // 2. ה-Prompt: פקודה ל-Gem להיות אישי וזוכר
    const prompt = `
      זהות: מנהל הזמנות בח.סבן, חבר ושותף של הלקוח.
      הקשר אישי (חובה להשתמש בזה לפתיח): ${personalContext}
      זיכרון שיחות קודמות: ${chatHistory.slice(-1000)}
      
      משימה:
      - אם הלקוח חזר אחרי זמן, פתח בברכה אישית: "אהלן [שם], טוב שחזרת!". 
      - שאל שאלה על נושא טכני שעלה בשיחה קודמת (למשל: איך יצאה המקלחת? הפריימר תפס?).
      - אם הייתה הזמנה, שאל אם לספק לאותה כתובת או לעדכן חדשה.
      
      חוקי פקודות (בסוף התגובה):
      SET_USER_NAME:[שם], SAVE_ORDER_DB:[פריט]:[כמות], CLIENT_NOTE:[הערה].
      
      הודעת לקוח נוכחית: "${cleanMsg}"
    `;

    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(15000)
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // 3. עיבוד פקודות ועדכון שם
    const nameMatch = replyText.match(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/i);
    const updatedName = nameMatch ? nameMatch[1].replace(/[\[\]\(\)]/g, "").trim() : currentUserName;

    // הזרקה ללוח אם יש פקודה או מילות מפתח
    if (replyText.includes("SAVE_ORDER_DB") || cleanMsg.includes("מכולה") || cleanMsg.includes("היום")) {
      const clientNote = replyText.match(/CLIENT_NOTE[:\(\[].*?(\]|\)|$|\n)/i)?.[1] || "חזר להזמנה נוספת";
      await supabase.from('orders').insert([{
        client_info: `שם: ${updatedName} | טלפון: ${phone}`,
        warehouse: cleanMsg,
        status: 'pending',
        has_new_note: true,
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    // 4. עדכון הזיכרון ארוך הטווח (שומרים את השאלה והתשובה)
    const memoryEntry = `\n[${new Date().toLocaleDateString('he-IL')}] U: ${cleanMsg} | AI: ${replyText.slice(0, 150)}`;
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: updatedName, 
      accumulated_knowledge: (chatHistory + memoryEntry).slice(-2000) // זיכרון מורחב ל-2000 תווים
    }, { onConflict: 'clientId' });

    // 5. ניקוי תשובה ללקוח
    let finalReply = replyText
      .replace(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/CLIENT_NOTE[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/SAVE_ORDER_DB[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/[\[\]\(\)]/g, "")
      .trim();

    return res.status(200).json({ reply: finalReply || `אהלן ${updatedName}, ברוך השב! איך אני יכול לעזור היום?` });

  } catch (error) {
    return res.status(200).json({ reply: "אחי, המערכת בהתרעננות קלה, כבר עונה לך לעניין." });
  }
}
