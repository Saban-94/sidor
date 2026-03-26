import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

// הגדרת משתנים וחיבורים
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

// לוגו המותג היוקרתי
const BRAND_LOGO = "https://iili.io/qstzfVf.jpg";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const { message, name, state, isGroup, senderPhone } = req.body; 

    if (!message) return res.status(200).json({ reply: "אחי, ההודעה ריקה. תנסה שוב." });
    if (!apiKey) return res.status(200).json({ reply: "⚠️ חסר מפתח API בשרת." });

    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-1.5-flash", "gemini-pro"];

    try {
        // 🔥 1. משיכת עץ התפריט הדינמי מה-Flow Builder (Firestore)
        const flowSnap = await getDoc(doc(dbFS, 'system', 'bot_flow_config'));
        const flowData = flowSnap.exists() ? flowSnap.data() : { nodes: [], globalDNA: "" };
        const dynamicNodes = flowData.nodes || [];
        const globalDNA = flowData.globalDNA || "אתה ראמי, המוח הלוגיסטי של ח. סבן. דבר קצר ויוקרתי.";

        // 🔥 2. שומר סף (Guard Rail) - ניווט וזיהוי "חזור"
        let forcedState = state || 'MENU';
        const cleanMsg = message.trim();

        if (['0', 'חזור', 'תפריט', 'איפוס'].includes(cleanMsg)) {
            forcedState = 'MENU';
        } else if (forcedState === 'MENU' || !state) {
            // זיהוי בחירה בתפריט לפי המפה הדינמית
            if (cleanMsg === '1') forcedState = 'INQUIRY';
            else if (cleanMsg === '2') forcedState = 'QUOTE';
            else if (cleanMsg === '3') forcedState = 'ORDER';
            else if (cleanMsg === '4') forcedState = 'HUMAN_RAMI';
        }

        // 3. שליפת DNA אישי מה-CRM (אם קיים)
        let customerDNA = '';
        if (senderPhone) {
            const custSnap = await getDoc(doc(dbFS, 'customers', senderPhone)).catch(() => null);
            if (custSnap?.exists()) customerDNA = `\nDNA אישי ללקוח: ${custSnap.data().dnaContext || 'רגיל'}`;
        }

        // 4. שליפת מלאי (רק בסטטוס בירור)
        let invInfo = "";
        if (forcedState === 'INQUIRY') {
            const keyword = message.replace(/[^\w\sא-ת]/gi, '').split(/\s+/).filter((w: string) => w.length > 2)[0] || message;
            const { data } = await supabase.from('inventory').select('*').ilike('product_name', `%${keyword}%`).limit(3); 
            if (data && data.length > 0) {
                invInfo = data.map(p => `💎 מוצר: ${p.product_name} | מחיר: ₪${p.price} | לינק: https://sidor.vercel.app/product/${p.sku}`).join('\n');
            }
        }

        // 🔥 5. בניית הפרומפט המבוסס על ה-Flow Builder
        const nodesInstructions = dynamicNodes.map((n: any) => `מצב [${n.id}]: ${n.prompt}`).join('\n');

        const prompt = `
        ${globalDNA}
        ${customerDNA}

        -- מפת ענפי השיחה הדינמית (Flow Builder) --
        ${nodesInstructions}

        -- מצב נוכחי של הלקוח: ${forcedState} --
        הודעת הלקוח: "${message}"

        -- חוקי עיצוב יוקרתיים (WhatsApp Style) --
        1. אם המצב הוא MENU (או הלקוח ביקש לחזור): 
           - הצג תפריט מעוצב עם אימוג'ים יוקרתיים (✨, 🏗️, 💎, 🚚, 📞).
           - השתמש בכתב מודגש לעיקרים (*טקסט*).
           - חובה להחזיר את הלינק ${BRAND_LOGO} בשדה ה-mediaUrl.
        
        2. זיהוי המשכיות: אם הלקוח שואל שאלת המשך על מוצר או מחיר, אל תחזור לתפריט, הישאר במצב הנוכחי וענה לו במקצועיות.
        3. תמיד הצע "להקליד 0 לחזרה לתפריט הראשי" בסוף הודעה שאינה תפריט.

        מידע מהמלאי: ${invInfo || 'אין כרגע התאמה מדויקת.'}

        -- פורמט חובה: JSON בלבד --
        {
          "reply": "הטקסט המעוצב ללקוח",
          "newState": "${forcedState}",
          "mediaUrl": "${forcedState === 'MENU' ? BRAND_LOGO : 'null'}"
        }
        `;

        // 6. הרצת המודלים (רוטציה)
        let jsonResult: any = null;
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
                    if (forcedState === 'MENU') jsonResult.mediaUrl = BRAND_LOGO; // וידוא לוגו בתפריט
                    break;
                }
            } catch (e) { continue; }
        }

        if (!jsonResult) return res.status(200).json({ reply: "⚠️ ראמי, המוח עמוס. נסה שוב בעוד רגע." });

        return res.status(200).json(jsonResult);

    } catch (e: any) {
        return res.status(200).json({ reply: `תקלה: ${e.message}` });
    }
}
