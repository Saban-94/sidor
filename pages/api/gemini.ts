import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

// 1. אתחול Supabase (מלאי ו-DNA)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. אתחול Firebase (לשמירת ידע וקאש של מוצרים)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

// 3. פונקציית שחקן חיזוק - מנוע חיפוש גוגל מותאם
async function getGoogleCseInfo(query: string) {
    const cx = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID || "1340c66f5e73a4076"; 
    const apiKey = process.env.Search_API_KEY || process.env.GOOGLE_SEARCH_API_KEY;
    if (!apiKey) return null;

    try {
        const res = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=1`
        );
        const data = await res.json();
        if (data.items && data.items.length > 0) {
            return {
                snippet: data.items[0].snippet,
                link: data.items[0].link,
                image: data.items[0].pagemap?.cse_image?.[0]?.src || null
            };
        }
        return null;
    } catch (e) { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY;
    const { message, context } = req.body; // context = ההנחיות של הלקוח מה-CRM

    if (!message) return res.status(400).json({ error: "Missing message" });
    if (!apiKey) return res.status(500).json({ error: "API_KEY_MISSING" });

    // מנגנון Fallback של מודלים
    const modelPool = [
        "gemini-3.1-flash-lite-preview",
        "gemini-3.1-flash-preview",
        "gemini-2.0-flash-exp"
    ];

    try {
        // 4. שליפה מקבילית: DNA, מלאי, וזיכרון מוקשמון (Cache) מפיירבייס
        const [rulesRes, invRes, cacheSnap] = await Promise.all([
            supabase.from('system_rules').select('instruction').eq('agent_type', 'consultant').eq('is_active', true),
            supabase.from('inventory').select('*').textSearch('product_name', message, { config: 'hebrew' }).limit(1),
            getDocs(collection(dbFS, "knowledge_base")).catch(() => ({ docs: [] })) // הגנה מקריסה
        ]);

        const rules = rulesRes.data;
        const inv = invRes.data;
        const cacheDocs = cacheSnap.docs.map(d => d.data());

        // הרכבת מידע טכני מהקאש (חסכון בחיפושים)
        let knowledgeBaseText = "";
        if (cacheDocs.length > 0) {
            knowledgeBaseText = "\nמידע טכני מהמאגר שלנו (השתמש בזה כדי לחסוך חיפוש):\n" + 
                                cacheDocs.map(p => `- ${p.productName}: ${p.description}`).join("\n");
        }

        // 5. הפעלת שחקן חיזוק (גוגל) רק אם אין במלאי הפנימי
        // תיקון טייפסקריפט: הגדרה מפורשת שזה לא רק null אלא יכול להיות כל סוג (any)
        let googleSearchInfo: any = null;
        if (!inv || inv.length === 0) {
            googleSearchInfo = await getGoogleCseInfo(message);
        }

        // 6. הרכבת הפרומפט האולטימטיבי
        const consultantDNA = rules?.map(r => r.instruction).join("\n") || "אתה יועץ טכני מקצועי של ח. סבן.";
        const productInfo = inv?.length ? JSON.stringify(inv) : "המוצר לא נמצא במלאי הפנימי.";
        const googleContext = googleSearchInfo ? `\nמידע משלים מגוגל: ${googleSearchInfo.snippet}\nקישור: ${googleSearchInfo.link}` : "";
        
        const prompt = `
        הנחיות התנהגות מול הלקוח הנוכחי (CRM):
        ${context || 'לקוח רגיל'}
        
        הנחיות יועץ (DNA מ-Supabase): ${consultantDNA}
        ${knowledgeBaseText}
        
        נתוני מלאי בזמן אמת: ${productInfo}
        ${googleContext}
        
        חוק קריטי: אם נעזרת ב"מידע משלים מגוגל" כדי ללמוד על מוצר חדש,הצג תמונת מוצר או סרטון הדרכה תחפש מהרשת  חובה להוסיף בסוף התשובה שלך את השורה המדויקת הבאה כדי שנזכור זאת:
        [SAVE_PRODUCT: שם_המוצר | תקציר_טכני_של_שלוש_שורות]
        .🚀חתימה: ראמי זמין וגם אם לו דאג לי יקבל את ההזמנה רק תאשר לי שיגור 
        שאלה:
        ${message}
        `;
        
        // תיקון טייפסקריפט נוסף למניעת שגיאות בלולאה
        let lastError: any = null;
        let finalReply = "";
        let activeModel = "";

        // 7. לולאת מודלים - מנסה אחד אחרי השני עד להצלחה
        for (const modelName of modelPool) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
                    })
                });

                const data = await response.json();
                
                if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    finalReply = data.candidates[0].content.parts[0].text;
                    activeModel = modelName;
                    break; 
                }
            } catch (e: any) {
                lastError = e.message;
                continue; 
            }
        }

        if (!finalReply) throw new Error("All models failed: " + lastError);

        // 8. מנגנון תפיסת מוצרים חדשים ושמירתם למאגר (Caching)
        const saveMatch = finalReply.match(/\[SAVE_PRODUCT:\s*(.*?)\s*\|\s*(.*?)\]/);
        if (saveMatch) {
            const newProductName = saveMatch[1].trim();
            const newProductDesc = saveMatch[2].trim();
            
            try {
                await addDoc(collection(dbFS, "knowledge_base"), {
                    productName: newProductName,
                    description: newProductDesc,
                    addedAt: serverTimestamp(),
                    source: "google_search_cache"
                });
                console.log(`✅ המוח למד ושמר מוצר חדש: ${newProductName}`);
            } catch (err) {
                console.error("שגיאה בשמירת זיכרון מוצר:", err);
            }

            finalReply = finalReply.replace(/\[SAVE_PRODUCT:.*?\]/g, '').trim();
        }

        return res.status(200).json({ 
            reply: finalReply,
            products: inv,
            googleInfo: googleSearchInfo,
            activeModel: activeModel
        });

    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}
