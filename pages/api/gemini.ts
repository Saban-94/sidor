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
    const { message, name, state, isGroup, senderPhone, context } = req.body; 

    if (!message) return res.status(200).json({ reply: "אחי, שלחת הודעה ריקה." });
    if (!apiKey) return res.status(200).json({ reply: "⚠️ חסר מפתח GEMINI_API_KEY." });

    const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-1.5-flash", "gemini-pro"];

    // 🔥 שלב 1: שומר סף (Guard Rail) - מעבר מצבים ידני במידה ושלחו מספר בתפריט
    let forcedState = state || 'MENU';
    if (state === 'MENU' || !state) {
        if (message.trim() === '1') forcedState = 'INQUIRY';
        else if (message.trim() === '2') forcedState = 'QUOTE';
        else if (message.trim() === '3') forcedState = 'ORDER';
        else if (message.trim() === '4') forcedState = 'HUMAN_RAMI';
    }

    // 2. שליפת DNA מה-CRM
    let dynamicDNA = '';
    if (senderPhone && senderPhone !== 'simulator') {
        const customerSnap = await getDoc(doc(dbFS, 'customers', senderPhone)).catch(() => null);
        if (customerSnap?.exists()) {
            const cData = customerSnap.data();
            dynamicDNA = `\n--- 🧬 DNA אישי מה-CRM ---\n${cData.dnaContext || 'לקוח רגיל'}`;
        }
    }

    // 3. שליפת מלאי (רק אם אנחנו בבירור)
    let invInfo = "לא רלוונטי כרגע.";
    if (forcedState === 'INQUIRY') {
        const keyword = message.replace(/[^\w\sא-ת]/gi, '').split(/\s+/).filter((w: string) => w.length > 2)[0] || message;
        const { data } = await supabase.from('inventory').select('*').ilike('product_name', `%${keyword}%`).limit(3); 
        if (data && data.length > 0) {
            invInfo = data.map(p => `מוצר: ${p.product_name} | SKU: ${p.sku} | מחיר: ₪${p.price} | לינק: https://sidor.vercel.app/product/${p.sku} | תמונה: ${p.image_url}`).join('\n');
        }
    }

    const prompt = `
    אתה ראמי, המוח הלוגיסטי של ח. סבן.
    הלקוח: ${name || 'אח יקר'}. 
    מצב נוכחי במערכת: ${forcedState}
    
    ${dynamicDNA}

    -- מידע מהמלאי (חובה להשתמש אם רלוונטי) --
    ${invInfo}

    -- הנחיות להתנהגות --
    1. אם המצב הוא MENU: הצג את התפריט המסודר (1-4).
    2. אם המצב הוא INQUIRY: עזור לו למצוא מוצר מהמלאי שסופק לך. אל תמציא מוצרים! אם מצאת, שלח את הלינק המדויק.
    3. אם המצב הוא HUMAN_RAMI: הודע לו שראמי יחזור אליו והפסק לענות.
    
    דבר קצר, בשפת קבלנים ("עלא ראסי", "סגור").
    
    -- פורמט חובה: JSON בלבד --
    {
      "reply": "הטקסט לווצאפ",
      "newState": "${forcedState}",
      "mediaUrl": "URL לתמונה או null"
    }
    `;

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
                break;
            }
        } catch (e) { continue; }
    }

    if (!jsonResult) return res.status(200).json({ reply: "ראמי, יש תקלה במוח. תבדוק לוגים." });

    return res.status(200).json({ 
        reply: jsonResult.reply, 
        newState: jsonResult.newState,
        mediaUrl: jsonResult.mediaUrl 
    });
}
