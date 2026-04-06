import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const geminiKey = process.env.GEMINI_API_KEY;

// הגדרת נפח מקסימלי ל-10MB עבור סריקת תמונות ומסמכים כבדים
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, senderPhone, imageUrl, imageBase64 } = req.body;
  const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'guest';
  const clientId = senderPhone || userIP;

  // הנחיות המומחה: מילון מונחים טכני של ח.סבן
  const SYSTEM_PROMPT = `
    זהות: אתה המומחה הטכני הבכיר של "ח.סבן חומרי בניין". 
    תפקידך: לנתח תמונות ומסמכים מהשטח (אתרי בנייה, שיפוצים) ולתת פתרון הנדסי-יישומי.

    פרוטוקול זיהוי ויזואלי:
    1. סדק שיער (<1 מ"מ): הגדר כשטחי. פתרון: שפכטל פנים/חוץ + שיוף.
    2. סדק התפשטות: סדק רחב/דינמי. פתרון: מילוי גמיש (סיקה פלקס 11FC).
    3. ברזל חשוף/חלוד: אבחן כנזק מבני. פתרון: ניקוי הברזל, מריחת סיקה 610, וסגירה עם מרגמת שיקום סיקה 212.
    4. רטיבות/עובש: חפש כתמים כהים. פתרון: איטום צמנטי (סיקה 107) ב-2 שכבות. צריכה: 4 ק"ג למ"ר.

    מבנה תשובה חובה:
    - אבחון טכני: (מה אתה רואה בתמונה?)
    - גורם משוער: (למה זה קרה?)
    - מפרט ביצוע: (שלב אחרי שלב: ניקוי -> הכנה -> יישום).
    - רשימת קניות: (שמות מוצרים מדויקים וכמויות מוערכות).
  `;

  try {
    // פנייה למודל Gemini 2.0 Flash (תומך ב-Vision ו-Reasoning)
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: SYSTEM_PROMPT + "\n\nהודעת המשתמש: " + (message || "נתח את הממצאים בתמונה.") },
            ...(imageBase64 ? [{ inline_data: { mime_type: "image/jpeg", data: imageBase64 } }] : [])
          ]
        }],
        generationConfig: {
          temperature: 0.4, // דיוק טכני גבוה
          topP: 0.8,
          maxOutputTokens: 1000
        }
      })
    });

    const data = await aiRes.json();
    
    // טיפול בשגיאות API
    if (data.error) {
      console.error("Gemini Error:", data.error);
      throw new Error(data.error.message);
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "לא הצלחתי לנתח את התמונה. וודא שהיא ברורה ונסה שוב.";

    // צבירת ניסיון וירטואלי: שמירת הסריקה ב-Supabase
    if (imageBase64 && imageUrl) {
      const issueType = reply.includes("סדק") ? "סדק" : 
                        reply.includes("ברזל") ? "שיקום בטון" : 
                        reply.includes("רטיבות") ? "איטום" : "כללי";

      await supabase.from('vision_analysis_logs').insert({
        clientId,
        image_url: imageUrl,
        analysis_result: reply,
        detected_issue: issueType,
        recommended_product: reply.match(/סיקה \d+/g)?.[0] || "לא צוין"
      });
    }

    return res.status(200).json({ reply });

  } catch (error: any) {
    console.error("Brain Error:", error.message);
    return res.status(500).json({ error: "המוח הוויזואלי נתקל בשגיאה טכנית." });
  }
}
