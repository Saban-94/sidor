import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

// הגדרות סביבה - Supabase & Firebase
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
    
    // תיקון קריטי: פירוק manualInjection מה-body כדי שיהיה מוכר ל-TS
    const { message, name, state, senderPhone, manualInjection } = req.body; 

    // הגנות בסיס
    if (!message && !manualInjection) {
        return res.status(200).json({ reply: "קיבלתי הודעה ריקה, אחי. איך אפשר לעזור?" });
    }
    
    if (!apiKey) {
        return res.status(200).json({ reply: "⚠️ שגיאת מפתח API בשרת." });
    }

    // בריכת מודלים לגיבוי (Rotation)
    const modelPool = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];

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
        }

        // 3. שליפת DNA אישי מה-CRM (Firestore)
        let customerDNA = '';
        if (senderPhone) {
            const custSnap = await getDoc(doc(dbFS, 'customers', senderPhone)).catch(() => null);
            if (custSnap?.exists()) {
                const cData = custSnap.data();
                customerDNA = `\nDNA אישי ללקוח: ${cData.dnaContext || 'לקוח רגיל'}`;
            }
        }

        // 4. שליפת מלאי חכמה מ-Supabase (רק בבירור מוצר)
        let invInfo = "";
        if (forcedState === 'INQUIRY') {
            const keyword = cleanMsg.replace(/[^\w\sא-ת]/gi, '').split(/\s+/).filter((w: string) => w.length > 2)[0] || cleanMsg;
            const { data } = await supabase.from('inventory').select('*').ilike('product_name', `%${keyword}%`).limit(3); 
            if (data && data.length > 0) {
                invInfo = data.map(p => `💎 מוצר: ${p.product_name} | SKU: ${p.sku} | מחיר: ₪${p.price}`).join('\n');
            }
        }

        // 5. בניית הנחיות העץ (Nodes Instructions)
        const nodesInstructions = dynamicNodes.map((n: any) => `מצב [${n.id}]: ${n.prompt}`).join('\n');

        // 6. בניית ה-Prompt המשולב
        const prompt = `
        ${globalDNA}
        ${customerDNA}

        -- מפת ענפי השיחה מהסטודיו (Flow Builder) --
        ${nodesInstructions}

        -- נתונים אישיים --
        שם הלקוח: ${name || 'אח יקר'}
        מספר טלפון: ${senderPhone || 'לא ידוע'}
        לוגו המותג: ${BRAND_LOGO}

        -- מצב נוכחי: ${forcedState} --
        הודעת הלקוח: "${message}"

        -- חוקי עיצוב יוקרתיים --
        1. בתפריט (MENU): הצג אימוג'ים (✨, 🏗️, 💎), כתב מודגש, ושלח את ${BRAND_LOGO} ב-mediaUrl.
        2. בבירור (INQUIRY): השתמש בנתוני המלאי: ${invInfo}.
        3. פורמט חובה: JSON בלבד.

        {
          "reply": "טקסט מעוצב",
          "newState": "${forcedState}",
          "mediaUrl": "URL או null",
          "pdfUrl": "URL או null",
          "actionButton": { "text": "טקסט", "link": "URL" } או null
        }
        `;

        // 7. הרצת מודלים ברוטציה (Fallback)
        let jsonResult = null;
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
                    if (forcedState === 'MENU') jsonResult.mediaUrl = BRAND_LOGO;
                    break;
                }
            } catch (e) { 
                console.error(`Error with model ${modelName}:`, e);
                continue; 
            }
        }

        return res.status(200).json(jsonResult || { reply: "משהו השתבש במוח, נסה שוב." });

    } catch (e: any) {
        console.error("Server API Error:", e);
        return res.status(200).json({ reply: `תקלה בשרת: ${e.message}` });
    }
}
