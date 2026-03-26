import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

// הגדרות סביבה
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

// נכסי מותג קבועים
const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const { message, name, state, isGroup, senderPhone, manualInjection } = req.body; 

    // הגנות בסיס
    if (!message && !manualInjection) return res.status(200).json({ reply: "קיבלתי הודעה ריקה, אחי. איך אפשר לעזור?" });
    if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API בשרת." });

    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-1.5-flash", "gemini-pro"];

    try {
        // 1. משיכת עץ ה-Flow הדינמי מהסטודיו (Firestore)
        const flowSnap = await getDoc(doc(dbFS, 'system', 'bot_flow_config'));
        const flowData = flowSnap.exists() ? flowSnap.data() : { nodes: [], globalDNA: "" };
        const dynamicNodes = flowData.nodes || [];
        const globalDNA = flowData.globalDNA || "אתה ראמי, המוח הלוגיסטי של ח. סבן. דבר קצר, יוקרתי ובשפת השטח.";

        // 2. ניווט חכם וזיהוי "חזור" (Guard Rail)
        let forcedState = state || 'MENU';
        const cleanMsg = (message || "").trim();

        if (['0', 'חזור', 'תפריט', 'איפוס'].includes(cleanMsg)) {
            forcedState = 'MENU';
        } else if (forcedState === 'MENU' || !state) {
            if (cleanMsg === '1') forcedState = 'INQUIRY';
            else if (cleanMsg === '2') forcedState = 'QUOTE';
            else if (cleanMsg === '3') forcedState = 'ORDER';
            else if (cleanMsg === '4') forcedState = 'HUMAN_RAMI';
        }

        // 3. שליפת DNA אישי מה-CRM
        let customerDNA = '';
        if (senderPhone) {
            const custSnap = await getDoc(doc(dbFS, 'customers', senderPhone)).catch(() => null);
            if (custSnap?.exists()) {
                const cData = custSnap.data();
                customerDNA = `\nDNA אישי ללקוח: ${cData.dnaContext || 'לקוח רגיל'}`;
            }
        }

        // 4. שליפת מלאי חכמה (רק בבירור מוצר)
        let invInfo = "";
        if (forcedState === 'INQUIRY') {
            const keyword = cleanMsg.replace(/[^\w\sא-ת]/gi, '').split(/\s+/).filter((w: string) => w.length > 2)[0] || cleanMsg;
            const { data } = await supabase.from('inventory').select('*').ilike('product_name', `%${keyword}%`).limit(3); 
            if (data && data.length > 0) {
                invInfo = data.map(p => `💎 מוצר: ${p.product_name} | SKU: ${p.sku} | מחיר: ₪${p.price} | לינק: https://sidor.vercel.app/product/${p.sku} | תמונה: ${p.image_url}`).join('\n');
            }
        }

        // 5. בניית הנחיות העץ (Nodes Instructions)
        const nodesInstructions = dynamicNodes.map((n: any) => `מצב [${n.id}]: ${n.prompt}`).join('\n');

        // 6. בניית ה-Prompt המשולב (DNA + Studio + Luxury)
        const prompt = `
        ${globalDNA}
        ${customerDNA}

        -- מפת ענפי השיחה מהסטודיו (Flow Builder) --
        ${nodesInstructions}

        -- נתונים אישיים ולינקים --
        שם הלקוח: ${name || 'אח יקר'}
        מספר טלפון: ${senderPhone || 'לא ידוע'}
        לינק קסם אישי: https://sidor.vercel.app/start?ref=${senderPhone || 'guest'}
        לוגו המותג: ${BRAND_LOGO}

        -- מצב נוכחי של הלקוח: ${forcedState} --
        הודעת הלקוח: "${message}"

        -- חוקי עיצוב והתנהגות יוקרתיים --
        1. אם המצב הוא MENU: 
           - הצג תפריט מעוצב לעילא עם אימוג'ים יוקרתיים (✨, 🏗️, 💎, 🚚, 📞).
           - השתמש בכתב מודגש (*טקסט*) להדגשת אפשרויות.
           - חובה להחזיר את ${BRAND_LOGO} בשדה ה-mediaUrl.
        
        2. בירור מוצר (INQUIRY):
           - אם מצאת מוצר במלאי (${invInfo}), צרף את לינק המחשבון הייעודי שלו.
           - אם יש תמונה למוצר בנתונים, שים אותה ב-mediaUrl.
        
        3. לינקי קסם וקבצים:
           - אם הלקוח שואל על אזור אישי או מסמכים, שלח לו את "לינק הקסם האישי" בטקסט.
           - במידה ונדרש PDF (קטלוג/מחירון), ציין את ה-URL שלו בשדה ה-pdfUrl.

        4. זיהוי המשכיות: אל תחזור לתפריט אם הלקוח שואל שאלת המשך מקצועית. הישאר בענף.
        
        5. בכל הודעה שאינה תפריט, הוסף בסוף בכתב קטן: "להתחלה מחדש הקש 0".

        -- פורמט חובה: JSON בלבד --
        {
          "reply": "הטקסט המעוצב והיוקרתי",
          "newState": "${forcedState}",
          "mediaUrl": "URL לתמונה (לוגו בתפריט / תמונת מוצר בבירור) או null",
          "pdfUrl": "לינק לקובץ PDF אם נדרש, אחרת null",
          "actionButton": { "text": "טקסט לכפתור", "link": "URL ללינק קסם או מוצר" } או null
        }
        `;

        // 7. הרצת מודלים ברוטציה (Fallback)
        let jsonResult: any = null;
        let errorLogs: string[] = [];

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
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    jsonResult = JSON.parse(data.candidates[0].content.parts[0].text);
                    // דריסת לוגו בתפריט למניעת טעויות AI
                    if (forcedState === 'MENU') jsonResult.mediaUrl = BRAND_LOGO;
                    break;
                }
            } catch (e: any) {
                errorLogs.push(`${modelName}: ${e.message}`);
                continue;
            }
        }

        if (!jsonResult) return res.status(200).json({ reply: `⚠️ ראמי, המוח עמוס. שגיאות: ${errorLogs.join(" | ")}` });

        return res.status(200).json(jsonResult);

    } catch (e: any) {
        return res.status(200).json({ reply: `תקלה בשרת: ${e.message}` });
    }
}
