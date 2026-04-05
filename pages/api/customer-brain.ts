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
  
  // זיהוי ייחודי - תיקון: לוקח IP אם אין טלפון כדי לשמור המשכיות בצאט
  const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'guest';
  const clientId = senderPhone?.replace('@c.us', '') || userIP;
  
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  try {
    // 1. שליפת זיכרון קפדנית לפי ה-ID
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', clientId).maybeSingle();
    
    let currentUserName = memory?.user_name || "אורח";
    let chatHistory = memory?.accumulated_knowledge || "";

    // 2. זיהוי שם ידני מההודעה (אם ה-Gem יפספס, אנחנו נתפוס)
    if (cleanMsg.includes("השם שלי") || cleanMsg.includes("אני בר")) {
       const extractedName = cleanMsg.replace("השם שלי", "").replace("אני", "").replace("מספר טלפון שלי", "").split(/[0-9]/)[0].trim();
       if (extractedName.length > 1) currentUserName = extractedName;
    }

    const prompt = `
      אתה מנהל ההזמנות בח.סבן. 
      לקוח נוכחי: ${currentUserName}.
      היסטוריה: ${chatHistory.slice(-1500)}
      
      משימה:
      1. אם הלקוח אמר את שמו (${currentUserName}), תפסיק לשאול "איך לעזור" ותתחיל לייעץ לו ישירות על מה שביקש.
      2. זכור: בר אורני = ${currentUserName}. תתייחס אליו אישית!
      3. פקודות בסוף: SET_USER_NAME:[שם], CLIENT_NOTE:[הערה].
      
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

    // 3. עדכון שם וביצוע פקודות
    const nameMatch = replyText.match(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/i);
    const updatedName = nameMatch ? nameMatch[1].replace(/[\[\]\(\):]/g, "").trim() : currentUserName;

    // 4. שמירה כפול ב-DB (גם שם וגם היסטוריה)
    const newEntry = `\n[${new Date().toLocaleTimeString('he-IL')}] U: ${cleanMsg} | AI: ${replyText.slice(0, 150)}`;
    
    await supabase.from('customer_memory').upsert({
      clientId: clientId, 
      user_name: updatedName, 
      accumulated_knowledge: (chatHistory + newEntry).slice(-2500)
    }, { onConflict: 'clientId' });

    // 5. ניקוי אנגלית ושליחה
    let finalReply = replyText
      .replace(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/CLIENT_NOTE[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/SAVE_ORDER_DB[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/[\[\]\(\)]/g, "")
      .trim();

    return res.status(200).json({ reply: finalReply || `שלום ${updatedName}, איך אני יכול לעזור?` });

  } catch (error) {
    return res.status(200).json({ reply: `אחי ${currentUserName}, אני איתך. מה לגבי הייעוץ הטכני שביקשת?` });
  }
}
