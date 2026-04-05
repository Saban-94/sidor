import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const modelPool = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-pro-preview",
  "gemini-2.0-flash"
];

const MUNICIPALITY_RULES: any = {
  "כפר סבא": { alert: "ויצמן כפר סבא הוא ציר ראשי - חובה פינוי עד 14:00 ותיאום מול העירייה." },
  "תל אביב": { alert: "חובה לפנות בשישי עד 10:00. קנס: ~730 ש\"ח." },
  "הרצליה": { alert: "אין השארה בסופ\"ש. פינוי חובה בשישי עד 14:00." }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'unknown';
  const geminiKey = process.env.GEMINI_API_KEY;
  const selectedModel = modelPool[Math.floor(Math.random() * modelPool.length)];

  console.log(`--- [START] צינור חיבור: הודעה מ-${phone} ---`);
  console.log(`הודעה גולמית מהלקוח: "${cleanMsg}"`);

  try {
    // 1. שליפת נתונים מהמאגר
    const { data: training } = await supabase.from('ai_training').select('content');
    const { data: inventory } = await supabase.from('brain_inventory').select('*');
    const { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    const { data: lastOrder } = await supabase.from('orders').select('*').ilike('client_info', `%${phone}%`).order('created_at', { ascending: false }).limit(1).maybeSingle();
    
    let currentUserName = memory?.user_name || "";
    const chatHistory = memory?.accumulated_knowledge || "";

    // זיהוי עיר
    let cityLogic = "";
    for (const city in MUNICIPALITY_RULES) {
      if (cleanMsg.includes(city)) {
        cityLogic = `דגש עירוני למשימה ב${city}: ${MUNICIPALITY_RULES[city].alert}`;
      }
    }

    // 2. בניית ה-Prompt
    const prompt = `
      זהות: אתה המוח של "ח.סבן". מנהל עבודה חד ותכליתי.
      לקוח: ${currentUserName || 'חדש'}.
      חוקים:
      - אם הלקוח ציין שם (כמו "לוי"), רשום בזיכרון.
      - ${cityLogic}
      - לכל בקשה דחופה ("להיום", "ויצמן"): הוסף CLIENT_NOTE:[דחוף: ${cleanMsg}].
      - לאישור סגור: SAVE_ORDER_DB:[ITEM]:[QTY].
      סגנון: פינג-פונג קצר. בלי חפירות.
      היסטוריה: ${chatHistory.slice(-500)}
      הודעה נוכחית: "${cleanMsg}"
    `;

    console.log(`--- [PROMPT TO GEMINI] מודל: ${selectedModel} ---`);
    console.log(prompt);

    // 3. קריאה ל-Gemini
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const aiData = await aiRes.json();
    const replyText = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    console.log(`--- [REPLY FROM GEMINI] ---`);
    console.log(replyText);

    // 4. עיבוד פקודות וזיהוי שם
    if (cleanMsg.includes("לוי") || (cleanMsg.length < 15 && !currentUserName.includes(cleanMsg) && !cleanMsg.includes("?"))) {
      currentUserName = currentUserName ? `${currentUserName} ${cleanMsg}` : cleanMsg;
      console.log(`שם לקוח עודכן ל: ${currentUserName}`);
    }

    const isUrgent = cleanMsg.includes("היום") || cleanMsg.includes("ויצמן");
    const clientNote = replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || (isUrgent ? `דחוף: ${cleanMsg}` : null);
    const hasTrigger = replyText.includes("SAVE_ORDER_DB:") || replyText.includes("CLIENT_NOTE:") || isUrgent;

    if (hasTrigger) {
      console.log(`טריגר הזרקה זוהה! שומר ל-Supabase...`);
      const { error: dbError } = await supabase.from('orders').insert([{
        client_info: `שם: ${currentUserName || 'אורח'} | טלפון: ${phone}`,
        warehouse: cleanMsg,
        customer_note: clientNote,
        has_new_note: !!clientNote,
        status: 'pending',
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);

      if (dbError) console.error("שגיאת הזרקה ל-DB:", dbError.message);
      else console.log("הזמנה נשמרה בהצלחה בטבלה.");
    }

    // 5. עדכון זיכרון
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: currentUserName, 
      accumulated_knowledge: (chatHistory + "\nU: " + cleanMsg + "\nAI: " + replyText).slice(-1200)
    }, { onConflict: 'clientId' });

    // ניקוי פקודות לפני שליחה ללקוח
    const finalReply = replyText.replace(/\[.*?\]/g, "").replace(/SAVE_ORDER_DB:.*?/g, "").replace(/CLIENT_NOTE:.*?/g, "").trim();

    console.log(`--- [END] תשובה סופית ללקוח: "${finalReply}" ---`);
    return res.status(200).json({ reply: finalReply || "קיבלתי, מטפל בזה." });

  } catch (error: any) {
    console.error("--- [CRITICAL ERROR] ---", error.message);
    return res.status(200).json({ reply: "מטפל בבקשה שלך, כבר חוזר אליך." });
  }
}
