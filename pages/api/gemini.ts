import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
const app = getApps().length > 0 ? getApp() : initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const dbFS = getFirestore(app);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const { message, name, state, isGroup } = req.body; 

    // 🔥 בדיקות תקינות (הגנה על השרת)
    if (!message) return res.status(200).json({ reply: "אחי, קיבלתי הודעה ריקה. תנסה שוב." });
    if (!apiKey) return res.status(200).json({ reply: "⚠️ ראמי, חסר מפתח GEMINI_API_KEY ב-Vercel! השרת לא יכול לדבר עם המוח." });
    if (!supabaseUrl || !supabaseKey) return res.status(200).json({ reply: "⚠️ ראמי, חסרים מפתחות של Supabase ב-Vercel! לא יכול לשלוף מלאי." });

    // 🔥 מנגנון גיבוי חכם מול מודלים (Fallback)
    const modelPool = [
        "gemini-3.1-flash-lite-preview",
        "gemini-1.5-flash",         
        "gemini-1.5-flash-latest",  
        "gemini-pro"                
    ];

    // 🔥 שליפת מוצרים חכמה מותאמת לעברית (ilike)
    let invInfo = "לא רלוונטי כרגע.";
    if (state === 'INQUIRY' || message.length > 2) {
        // שולפים את מילת המפתח המרכזית מההודעה כדי למצוא התאמה רחבה במלאי
        const words = message.replace(/[^\w\sא-ת]/gi, '').split(/\s+/).filter((w: string) => w.length > 2);
        const keyword = words.length > 0 ? words[0] : message.trim();

        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .ilike('product_name', `%${keyword}%`) // חיפוש חכם וגמיש יותר בעברית
            .limit(3); 

        if (data && data.length > 0) {
            // מאכילים את ה-AI בכפית עם הלינק המדויק למוצר!
            invInfo = data.map(p => 
                `שם המוצר: ${p.product_name} | מחיר: ₪${p.price || 'לא הוגדר'} | לינק קסם להזמנה: https://sidor.vercel.app/product/${p.sku} | תמונה: ${p.image_url || 'null'}`
            ).join('\n');
        } else {
            invInfo = "המוצר המבוקש לא נמצא כרגע במלאי. תעדכן את הלקוח שאתה בודק חלופות.";
        }
    }

    // 🔥 פרוטוקול ה-DNA: חוקים נוקשים למכונת המצבים של ה-AI
    const prompt = `
    אתה ראמי, המוח הלוגיסטי של ח. סבן חומרי בניין. 
    אתה מנהל עכשיו שיחה עם לקוח בשם: ${name}.
    האם השיחה בקבוצה? ${isGroup ? 'כן. ענה קצר וענייני כדי לא להספים את הקבוצה.' : 'לא.'}
    
    המצב הנוכחי של הלקוח במערכת (State): ${state}
    הודעת הלקוח: "${message}"
    מידע מהמלאי שנשלף הרגע (אם נדרש): 
    ${invInfo}

    -- חוקי ניתוב מצבים (CRITICAL RULES) --
    עליך לנתח את ההודעה ולהחליט מה המצב הבא (newState) של הלקוח.
    
    1. אם State="MENU" (או שהלקוח אמר "תפריט" / קילל / הלך לאיבוד):
       - ענה לו עם התפריט: "אהלן ${name}! איך אפשר לעזור? הקש:\n1️⃣ לבירור על מוצר\n2️⃣ להצעת מחיר\n3️⃣ לשליחת הזמנה\n4️⃣ לדבר עם ראמי אישית"
       - ה-newState נשאר "MENU".
       - חריג: אם הוא ענה "1", שנה newState ל-"INQUIRY". אם "2", שנה ל-"QUOTE". אם "3", שנה ל-"ORDER". אם "4", שנה ל-"HUMAN_RAMI".

    2. אם State="INQUIRY" (בירור מוצר):
       - קרא את 'מידע מהמלאי'. אם מצאת את המוצר, ענה לו בהתלהבות, ציין את המחיר, **וחובה להדביק את "לינק קסם להזמנה"** בדיוק כפי שמופיע בנתונים!
       - אם יש לינק לתמונה בנתונים שקיבלת (ולא null), שים אותה בשדה mediaUrl ב-JSON.
       - ה-newState נשאר "INQUIRY" עד שהוא מבקש משהו אחר.

    3. אם State="QUOTE" או "ORDER":
       - שאל אותו כוונות מדויקות (כמויות, כתובת אספקה).
       - ה-newState נשאר אותו דבר עד שהוא מאשר.

    4. אם State="HUMAN_RAMI" (או הלקוח הקיש 4):
       - ענה: "עלא ראסי אח יקר, העברתי את הפנייה לראמי. הוא יחזור אליך בהקדם."
       - ה-newState חייב להיות "HUMAN_RAMI" (זה ישתיק את הבוט מלענות לו בעתיד עד שראמי יתערב).

    -- פורמט חובה: רק JSON --
    אתה חייב להחזיר אך ורק אובייקט JSON תקין (בלי מרכאות סביבו, נקי לחלוטין) במבנה הבא:
    {
      "reply": "הטקסט שיישלח ללקוח בווצאפ (כולל לינק הקסם למוצר אם מצאת במלאי)",
      "newState": "MENU או INQUIRY או QUOTE או ORDER או HUMAN_RAMI",
      "mediaUrl": "לינק לתמונה אם מצאת במלאי, אחרת null"
    }
    `;

    let jsonResult: any = null;
    let errorLogs: string[] = [];

    // 🔥 לולאת הרוטציה - מנסה מודל אחרי מודל עד להצלחה
    for (const modelName of modelPool) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        temperature: 0.1, 
                        responseMimeType: "application/json"
                    } 
                })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                jsonResult = JSON.parse(data.candidates[0].content.parts[0].text);
                break; // תפסנו תשובה תקינה, יוצאים מהלולאה!
            } else if (data.error) {
                throw new Error(data.error.message);
            }
        } catch (e: any) {
            errorLogs.push(`${modelName}: ${e.message}`);
            continue; // עוברים למודל הבא בתור
        }
    }

    if (!jsonResult) {
        return res.status(200).json({ reply: `⚠️ ראמי, כל המודלים קרסו. שגיאות: ${errorLogs.join(" | ")}` });
    }

    return res.status(200).json({ 
        reply: jsonResult.reply, 
        newState: jsonResult.newState,
        mediaUrl: jsonResult.mediaUrl 
    });
}
