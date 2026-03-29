import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const phone = senderPhone?.replace('@c.us', '') || 'unknown';

  try {
    // 1. שליפה ויצירת משתמש אם חסר
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    if (cleanMsg === "הוסף הזמנה") history = "";

    // 2. עדכון היסטוריה מקומי (למניעת לופים בגלל דיליי ב-DB)
    const updatedHistory = history + `\nUser: ${cleanMsg}`;

    // 3. בניית ה-Prompt עם לוגיקה "אנטי-לופ"
    const prompt = `
      אתה העוזר של ראמי. קצר (מילה-שתיים).
      עץ קשיח: 1.שם לקוח? -> 2.כתובת? -> 3.מחסן? -> 4.נהג?

      היסטוריה נוכחית:
      ${updatedHistory}

      חוקים למניעת חזרה:
      - אם המשתמש נתן כתובת (כמו "זאב בלפר"), אסור לשאול "כתובת?" שוב. עבור מיד ל-"מחסן?".
      - אם המשתמש נתן מחסן (התלמיד/החרש), עבור ל-"נהג?".
      
      תשובה (מילה-שתיים):
    `;

    // 4. קריאה ל-Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    let replyText = data.candidates[0].content.parts[0].text.trim();

    // 5. בדיקת סיום והזרקה
    let finalReply = replyText;
    if (replyText.includes('"complete": true') || (updatedHistory.includes("חכמת") || updatedHistory.includes("עלי") && replyText.includes("הוזרק"))) {
       // לוגיקת הזרקה (כפי שכתבנו קודם)
       finalReply = "הוזרק ללוח. 🚀";
       await supabase.from('customer_memory').update({ accumulated_knowledge: "" }).eq('clientId', phone);
    } else {
       // שמירת המצב החדש כולל שאלת המוח
       await supabase.from('customer_memory').update({ 
         accumulated_knowledge: updatedHistory + `\nAssistant: ${replyText}` 
       }).eq('clientId', phone);
    }

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, תקלה. נסה שוב." });
  }
}
