import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

// הגדרת משתנים
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    // 🔥 הוספנו את senderPhone כדי שה-API יידע למי לשלוף DNA
    const { message, name, state, isGroup, senderPhone, context } = req.body; 

    // הגנות השרת
    if (!message) return res.status(200).json({ reply: "אחי, קיבלתי הודעה ריקה. תנסה שוב." });
    if (!apiKey) return res.status(200).json({ reply: "⚠️ ראמי, חסר מפתח GEMINI_API_KEY ב-Vercel!" });
    if (!supabaseUrl || !supabaseKey) return res.status(200).json({ reply: "⚠️ ראמי, חסרים מפתחות Supabase!" });

    const modelPool = [
        "gemini-3.1-flash-lite-preview",
        "gemini-1.5-flash",         
        "gemini-1.5-flash-latest",  
        "gemini-pro"                
    ];

    // 1. שליפת ה-DNA החי ממסך ה-CRM ב-Firestore!
    let dynamicDNA = '';
    if (senderPhone && senderPhone !== 'simulator') {
        try {
            const customerSnap = await getDoc(doc(dbFS, 'customers', senderPhone));
            if (customerSnap.exists()) {
                const cData = customerSnap.data();
                if (cData.relation && cData.relation.startsWith('{')) {
                    const parsed = JSON.parse(cData.relation);
                    const rulesText = parsed.rules ? parsed.rules.map((r:any) => `- [${r.title}]: ${r.content}`).join('\n') : 'אין חוקים מיוחדים';
                    dynamicDNA = `\n--- 🧬 DNA אישי שמוגדר ללקוח זה ב-CRM ---\nזהות ה-AI מול הלקוח: ${parsed.identity || 'לקוח רגיל'}\nחוקי ברזל חובה:\n${rulesText}`;
                } else if (cData.relation) {
                    dynamicDNA = `\n--- 🧬 DNA אישי ללקוח זה ---\nזהות: ${cData.relation}`;
                }
            }
        } catch(e) { console.error("שגיאה בשליפת DNA", e); }
    }
    
    // אם הסימולטור שלח קונטקסט ישיר (בזמן אימון)
    if (context && !dynamicDNA) {
        dynamicDNA = `\n--- 🧬 DNA מהסימולטור (אימון) ---\n${context}`;
    }

    // 2. שליפת מלאי חכמה
    let invInfo = "לא רלוונטי כרגע.";
    if (state === 'INQUIRY' || message.length > 2) {
        const words = message.replace(/[^\w\sא-ת]/gi, '').split(/\s+/).filter((w: string) => w.length > 2);
        const keyword = words.length > 0 ? words[0] : message.trim();

        const { data } = await supabase.from('inventory').select('*').ilike('product_name', `%${keyword}%`).limit(3); 

        if (data && data.length > 0) {
            invInfo = data.map(p => 
                `שם המוצר: ${p.product_name} | מחיר: ₪${p.price || 'לא הוגדר'} | לינק להזמנה: https://sidor.vercel.app/product/${p.sku} | תמונה: ${p.image_url || 'null'}`
            ).join('\n');
        } else {
            invInfo = "המוצר המבוקש לא נמצא כרגע במלאי.";
        }
    }

    // 3. בניית המוח הסופי עם כל היכולות החדשות
    const prompt = `
    אתה ראמי, המוח הלוגיסטי של ח. סבן חומרי בניין. 
    אתה מנהל עכשיו שיחה עם הלקוח: ${name || 'לקוח'}.
    מספר הלקוח: ${senderPhone || 'לא סופק'}
    האם השיחה בקבוצה? ${isGroup ? 'כן. ענה קצר וענייני.' : 'לא.'}
    
    המצב הנוכחי של הלקוח במערכת (State): ${state || 'MENU'}
    הודעת הלקוח: "${message}"
    מידע מהמלאי (אם נדרש): \n${invInfo}

    ${dynamicDNA}

    -- 🔗 לינק קסם ותמונת פרופיל (AI) 🔗 --
    תמונת האווטאר שלך (ה-AI): https://iili.io/qstzfVf.jpg
    לינק הקסם הסודי של הלקוח: https://sidor.vercel.app/start?ref=${senderPhone || 'guest'}
    
    * אם הלקוח צריך להיכנס למערכת, לראות הצעת מחיר, או אם הוא שואל על אזור אישי/פגישות:
      1. שלח לו את "לינק הקסם" בטקסט עצמו.
      2. חובה! שים את כתובת תמונת האווטאר שלך (https://iili.io/qstzfVf.jpg) בשדה mediaUrl ב-JSON. זה ישלח לו את תמונת הפרופיל שלך לווצאפ יחד עם הלינק.

    -- חוקי ניתוב מצבים (CRITICAL RULES) --
    1. אם State="MENU" (או שהלקוח אמר "תפריט" / קילל / הלך לאיבוד):
       - ענה: "אהלן ${name || 'אח יקר'}! איך אפשר לעזור? הקש:\n1️⃣ לבירור על מוצר\n2️⃣ להצעת מחיר\n3️⃣ לשליחת הזמנה/פגישה (לינק קסם)\n4️⃣ לדבר עם ראמי אישית"
       - ה-newState נשאר "MENU".
       - מעברים: 1 -> INQUIRY, 2 -> QUOTE, 3 -> ORDER, 4 -> HUMAN_RAMI.

    2. אם State="INQUIRY" (בירור מוצר):
       - ענה על בסיס המלאי. אם יש לינק למחשבון (product/SKU), צרף אותו.
       - אם יש תמונה מהמלאי, שים ב-mediaUrl.
       - ה-newState נשאר "INQUIRY".

    3. אם State="QUOTE" או "ORDER":
       - שאל כוונות או הצע את לינק הקסם שלו כדי שימלא שם פרטים בנוחות.
       - ה-newState נשאר זהה עד לאישור.

    4. אם State="HUMAN_RAMI":
       - ענה: "עלא ראסי אח יקר, העברתי את הפנייה לראמי. הוא יחזור אליך בהקדם."
       - ה-newState נשאר "HUMAN_RAMI".

    -- פורמט חובה: רק JSON --
    אתה חייב להחזיר אובייקט JSON תקין נקי לחלוטין במבנה הבא:
    {
      "reply": "הטקסט שיישלח לווצאפ",
      "newState": "MENU או INQUIRY או QUOTE או ORDER או HUMAN_RAMI",
      "mediaUrl": "כתובת URL לתמונה (כגון אווטאר ה-AI או תמונת מוצר), או null"
    }
    `;

    let jsonResult: any = null;
    let errorLogs: string[] = [];

    // 4. לולאת רוטציה למודלים
    for (const modelName of modelPool) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.1, responseMimeType: "application/json" } 
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                jsonResult = JSON.parse(data.candidates[0].content.parts[0].text);
                break;
            } else if (data.error) { throw new Error(data.error.message); }
        } catch (e: any) {
            errorLogs.push(`${modelName}: ${e.message}`);
            continue;
        }
    }

    if (!jsonResult) return res.status(200).json({ reply: `⚠️ תקלה. שגיאות: ${errorLogs.join(" | ")}` });

    return res.status(200).json({ 
        reply: jsonResult.reply, 
        newState: jsonResult.newState,
        mediaUrl: jsonResult.mediaUrl 
    });
}
