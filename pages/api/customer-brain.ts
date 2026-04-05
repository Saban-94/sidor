import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-2.0-flash"];

// חוקי עיר - הוספתי את כפר סבא לפי הבקשה שלך
const MUNICIPALITY_RULES: any = {
  "כפר סבא": { alert: "הצבה ברחוב ויצמן דורשת אישור מיוחד (ציר ראשי). פינוי עד 14:00.", link: "https://bit.ly/kfar-saba-bins" },
  "תל אביב": { alert: "חובה לפנות בשישי עד 10:00. קנס: ~730 ש\"ח." },
  "הרצליה": { alert: "אין השארה בסופ\"ש. פינוי חובה בשישי עד 14:00." }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'unknown';
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    const { data: training } = await supabase.from('ai_training').select('content');
    const { data: inventory } = await supabase.from('brain_inventory').select('*');
    let { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    let { data: lastOrder } = await supabase.from('orders').select('*').ilike('client_info', `%${phone}%`).order('created_at', { ascending: false }).limit(1).maybeSingle();
    
    let currentUserName = memory?.user_name || "";
    let chatHistory = memory?.accumulated_knowledge || "";

    // תיקון לוגיקת עיר
    let cityLogic = "";
    for (const city in MUNICIPALITY_RULES) {
      if (cleanMsg.includes(city)) cityLogic = `דגש עירוני: ${MUNICIPALITY_RULES[city].alert}`;
    }

    // בניית ה-PROMPT החדש - פוקוס על ביצוע ולא על שאלות מיותרות
    const prompt = `
      זהות: המוח של "ח.סבן". אתה מנהל עבודה בשטח, לא פקיד.
      לקוח: ${currentUserName || 'חדש'}. טלפון: ${phone}.
      
      חוקי ברזל לשיחה:
      1. אם הלקוח נתן שם (למשל "לוי"), אל תשאל עליו שוב! רשום אותו בזיכרון.
      2. אם הלקוח מבקש מכולה/פינוי: זה בעדיפות עליונה. אל תציע לו חומרי בניין (סומסום/טיט) אלא אם הוא ביקש.
      3. אם חסרה כתובת או גודל מכולה, בקש אותם מיד.
      4. פקודות: הוסף SAVE_ORDER_DB:[SKU]:[QTY] רק כשברור מה הוא רוצה.
      5. הזיקית: אם יש בקשה דחופה ("להיום", "ויצמן 7"), הוסף CLIENT_NOTE:[דחוף: ${cleanMsg}].

      מידע מלאי: ${inventory?.map(i => `${i.product_name}: ${i.price}₪`).join(', ')}
      ${cityLogic}

      הודעת לקוח: "${cleanMsg}"
      היסטוריה: ${chatHistory.slice(-500)}
    `;

    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (replyText) break;
      } catch (e) { continue; }
    }

    // לוגיקת זיהוי שם משפרת (מונעת כפילויות)
    if (cleanMsg.length < 15 && !cleanMsg.includes(" ") && !currentUserName.includes(cleanMsg)) {
        currentUserName = currentUserName ? `${currentUserName} ${cleanMsg}` : cleanMsg;
    }

    // עדכון הזמנה/זיקית
    const isUrgent = cleanMsg.includes("היום") || cleanMsg.includes("דחוף");
    if (replyText.includes("SAVE_ORDER_DB:") || isUrgent) {
      const clientNote = replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || (isUrgent ? `דחוף להיום: ${cleanMsg}` : null);
      
      await supabase.from('orders').insert([{
        client_info: `שם: ${currentUserName} | טלפון: ${phone}`,
        warehouse: cleanMsg,
        customer_note: clientNote,
        has_new_note: !!clientNote,
        status: 'pending',
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: currentUserName, 
      accumulated_knowledge: (chatHistory + "\nU: " + cleanMsg + "\nAI: " + replyText).slice(-1200)
    }, { onConflict: 'clientId' });

    const finalReply = replyText.replace(/\[.*?\]/g, "").replace(/SAVE_ORDER_DB:.*?/g, "").replace(/CLIENT_NOTE:.*?/g, "").trim();
    return res.status(200).json({ reply: finalReply || "קיבלתי, בודק זמינות למכולה בכפר סבא ומעדכן." });

  } catch (error) {
    return res.status(200).json({ reply: "מטפל בבקשה שלך למכולה, כבר חוזר אליך." });
  }
}
