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
  
  // זיהוי ייחודי - שימוש ב-IP כגיבוי לטלפון
  const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'guest';
  const clientId = senderPhone?.replace('@c.us', '') || userIP;
  
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  // הגדרת משתנים מראש מחוץ ל-TRY כדי שה-CATCH יכיר אותם
  let currentUserName = "אורח";
  let chatHistory = "";

  try {
    // 1. שליפת זיכרון מה-DB
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', clientId).maybeSingle();
    
    if (memory) {
      currentUserName = memory.user_name || "אורח";
      chatHistory = memory.accumulated_knowledge || "";
    }

    // 2. זיהוי שם ידני מההודעה (למקרה של כשל ב-AI)
    if (cleanMsg.includes("השם שלי") || cleanMsg.includes("אני בר")) {
       const extractedName = cleanMsg.replace("השם שלי", "").replace("אני", "").replace("מספר טלפון שלי", "").split(/[0-9]/)[0].trim();
       if (extractedName.length > 1) currentUserName = extractedName;
    }

    const prompt = `
      אתה מנהל ההזמנות בח.סבן. 
      לקוח נוכחי: ${currentUserName}.
      היסטוריה: ${chatHistory.slice(-1500)}
      
      משימה:
      1. אם הלקוח אמר את שמו, פנה אליו בשמו והמשך בייעוץ/הזמנה.
      2. פקודות בסוף: SET_USER_NAME:[שם], CLIENT_NOTE:[הערה].
      
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

    // 3. עיבוד פקודות
    const nameMatch = replyText.match(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/i);
    const updatedName = nameMatch ? nameMatch[1].replace(/[\[\]\(\):]/g, "").trim() : currentUserName;

    // 4. שמירה ב-DB
    const newEntry = `\n[${new Date().toLocaleTimeString('he-IL')}] U: ${cleanMsg} | AI: ${replyText.slice(0, 150)}`;
    
    await supabase.from('customer_memory').upsert({
      clientId: clientId, 
      user_name: updatedName, 
      accumulated_knowledge: (chatHistory + newEntry).slice(-2500)
    }, { onConflict: 'clientId' });

    // 5. ניקוי אנגלית מהתשובה ללקוח
    let finalReply = replyText
      .replace(/SET_USER_NAME[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/CLIENT_NOTE[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/SAVE_ORDER_DB[:\(\[].*?(\]|\)|$|\n)/gi, "")
      .replace(/[\[\]\(\)]/g, "")
      .trim();

    return res.status(200).json({ reply: finalReply || `שלום ${updatedName}, איך אני יכול לעזור?` });

  } catch (error) {
    // עכשיו currentUserName זמין כאן וה-Build יעבור
    console.error("Critical Error:", error);
    return res.status(200).json({ 
      reply: currentUserName !== "אורח" 
        ? `אחי ${currentUserName}, המערכת בעומס קל. אני בודק את זה וחוזר אליך מיד.` 
        : "קיבלתי, בודק זמינות ומעדכן אותך." 
    });
  }
}
