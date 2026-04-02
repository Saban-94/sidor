import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // 1. שליפת זיכרון ומכולות פעילות בשטח
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    let { data: activeContainers } = await supabase.from('container_management').select('*').eq('is_active', true);
    
    // 2. בדיקת בעלות קבלן על הכתובת (למניעת ערבוב)
    let contractorLockInfo = "";
    // אם המשתמש ציין כתובת, נבדוק מי הקבלן שרשום עליה כרגע
    const addressInMsg = cleanMsg.match(/(?:ב|בכתובת\s+)([א-ת\s\d]+)(?=\s|$)/)?.[1];
    if (addressInMsg) {
       const existingMatch = activeContainers?.find(c => c.delivery_address.includes(addressInMsg.trim()));
       if (existingMatch) {
         contractorLockInfo = `🚨 שים לב: בכתובת זו קיימת מכולה של ${existingMatch.contractor_name}. חל איסור מוחלט לבצע החלפה או הוצאה על ידי קבלן אחר.`;
       }
    }

    const localUpdatedHistory = (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}`;

    // 3. הפרומפט עם "חוק איסור ערבוב קבלנים"
    const prompt = `
      זהות: מפקח מכולות בלי להצהיר זאת חכם של מכולות פינוי פסולת בשרון. סגנון: קצר, חד וממוקד עמודות.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴 בשיטת "פינג-פונג".
      
      מידע שטח נוכחי (קריטי): ${JSON.stringify(activeContainers)}
      בדיקת בעלות: ${contractorLockInfo}
      היסטוריית שיחה: ${localUpdatedHistory}
      
      חוקי ה"פינג-פונג" (קריטי):
      1. שאל שאלה אחת בלבד בכל פעם לפי סדר העץ.
      2. אל תמציא כתובת! אם המשתמש לא סיפק כתובת ברורה בשיחה, שאל עליה.
      3. אל תבצע הזרקה (DATA_START) עד שכל 5 השאלות נענו בבירור.
      4. אל תשתמש בכיתוב"**".
      5. טעצב טקסט UI/UX.
      
      חוקי ברזל חדשים (איסור ערבוב):
      1. חוק הבעלות: אם מבוצעת "החלפה" או "הוצאה", הקבלן המבצע חייב להיות זהה לקבלן שהציב את המכולה במקור בכתובת זו.
      2. במידה והמשתמש מבקש קבלן שונה ממה שמופיע ב"בדיקת בעלות", עצור הכל וענה: "שלילי בוס, המכולה בכתובת זו שייכת ל[שם הקבלן המקורי]. רק הוא רשאי לגעת בה."
      3. אל תאפשר הזרקה (DATA_START) אם יש סתירה בין הקבלנים.

      עץ שאלות: 1. לקוח -> 2. כתובת -> 3. פעולה -> 4. קבלן -> 5. זמן.
      חוקים קבועים: גודל תמיד 8 קוב.
    `;

    // 4. הרצה מול Gemini
    let replyText = "";
    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview"];
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        replyText = data.candidates[0].content.parts[0].text.trim();
        if (replyText) break;
      } catch (e) { continue; }
    }

    let isComplete = false;
    // 5. הזרקה כפולה (ניהול + דשבורד)
    if (replyText.includes('DATA_START')) {
      const jsonMatch = replyText.match(/\{.*\}/s);
      if (jsonMatch) {
        const d = JSON.parse(jsonMatch[0]);
        
        // וידוא אחרון בקוד (Back-end lock)
        const currentOwner = activeContainers?.find(c => c.delivery_address.includes(d.address))?.contractor_name;
        if ((d.action === 'EXCHANGE' || d.action === 'REMOVAL') && currentOwner && currentOwner !== d.contractor) {
             return res.status(200).json({ reply: `חסום! ניסית להוציא מכולה של ${currentOwner} עם ${d.contractor}. פעולה בוטלה.` });
        }

        // הזרקה... (הקוד הרגיל של ה-Insert לטבלאות)
        isComplete = true;
      }
    }

    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);
    return res.status(200).json({ reply: isComplete ? "בוס, המשימה עודכנה ללוח המכולות! 🚀" : replyText });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." });
  }
}
