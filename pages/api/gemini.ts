import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

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
    const { message, context } = req.body; 

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
    
    // זיהוי אוטומטי של הודעת פתיחה כדי להקפיץ תפריט בוט חכם
    const greetings = ['היי', 'שלום', 'בוקר טוב', 'תפריט', 'מה קורה', 'hi', 'hello'];
    const isGreeting = greetings.some(g => message.trim().toLowerCase() === g);

    try {
        const systemConfigSnap = await getDoc(doc(dbFS, "system", "search_config")).catch(() => null);
        const stopWords = systemConfigSnap?.exists() ? systemConfigSnap.data().stopWords : ['רוצה', 'להזמין', 'שק', 'משטח'];
        
        const cleanSearchTerm = message.replace(/[^\w\sא-ת]/gi, ' ').split(/\s+/).filter((w: string) => !stopWords.includes(w) && w.length > 1).join(' ').trim();

        let inv: any[] = [];
        if (cleanSearchTerm.length > 0 && !isGreeting) {
            const { data } = await supabase.from('inventory').select('*').textSearch('product_name', cleanSearchTerm, { type: 'websearch' }).limit(3); 
            inv = data || [];
        }

        const productInfo = inv.length ? JSON.stringify(inv) : "לא נמצאו מוצרים.";
        
        const prompt = `
        הזהות שלך: ראמי, מנהל התפעול של ח. סבן.
        הנחיות מהלקוח: ${context || 'לקוח רגיל בווצאפ.'}
        
        רשימת מוצרים שנשלפו הרגע מהמלאי: 
        ${productInfo}
        
        -- חוקי ברזל חמורים לווצאפ (קריטי) --
        1. **תפריט חכם (Chatbot Mode):** אם הלקוח אמר רק שלום/היי או שההודעה היא ברכה בלבד, ענה לו בדיוק ככה:
           "אהלן אח יקר! הגעת למוח הלוגיסטי של ח. סבן. הקש את המספר המבוקש:
           1️⃣ להזמנת חומרי בניין או מחירון
           2️⃣ לייעוץ טכני מהשטח
           3️⃣ לבדיקת סטטוס הובלה או סידור משאיות"
           
        2. **שליחת כרטיס מוצר (Images):** אם הלקוח מבקש מוצר שנמצא ברשימת המוצרים במלאי, והמוצר מכיל image_url, חובה עליך להוסיף בסוף התשובה שלך את התגית הבאה בדיוק:
           [IMAGE: שים_כאן_את_הלינק_לתמונה]
           (אל תשתמש בתגית אם אין תמונה במסד הנתונים).
           בנוסף, צרף תמיד את הלינק לדף הרכישה: https://sidor.vercel.app/product/SKU_של_המוצר
           
        3. תהיה קצר, גבר, ודבר בשפת קבלנים (עלא ראסי, אח יקר). אל תחפור.
        
        הודעת הלקוח: ${message}
        `;
        
        let finalReply = "";
        let errorLogs: string[] = [];

        // לולאת ניסיונות מול המודלים (כולל ה-3.1-flash החדש בראש התור)
        for (const modelName of modelPool) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.1, maxOutputTokens: 800 } 
                    })
                });

                const data = await response.json();
                
                if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    finalReply = data.candidates[0].content.parts[0].text;
                    break; 
                } else if (data.error) {
                    throw new Error(data.error.message);
                }
            } catch (e: any) {
                errorLogs.push(`${modelName}: ${e.message}`);
                continue; 
            }
        }

        if (!finalReply) {
             return res.status(200).json({ reply: `⚠️ ראמי, כל המודלים קרסו. שגיאות: ${errorLogs.join(" | ")}` });
        }

        return res.status(200).json({ reply: finalReply, products: inv });

    } catch (e: any) {
        return res.status(200).json({ reply: `תקלת שרת: ${e.message}` });
    }
}
