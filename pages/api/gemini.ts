import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

// 1. אתחול Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. אתחול Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

// 3. פונקציית שחקן חיזוק (גוגל)
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
    const { message, context } = req.body; 

    if (!message) return res.status(400).json({ error: "Missing message" });
    if (!apiKey) return res.status(500).json({ error: "API_KEY_MISSING" });

    const modelPool = [
        "gemini-3.1-flash-lite-preview", 
        "gemini-2.0-flash",       // מודל הדגל המהיר והחדש
        "gemini-1.5-flash",       // מודל גיבוי יציב
        "gemini-1.5-pro"          // גיבוי אחרון
    ];

    try {
        // 🔥 תיקון קריטי: מנקה סימני שאלה, פסיקים וכל מה שעלול להקריס את ה-DB
        const cleanSearchTerm = message.replace(/[^\w\sא-ת]/gi, ' ').trim();

        // 4. שליפה מקבילית סופר-מהירה (חסינה מקריסות עם catch פנימי)
        const [rulesRes, invRes, cacheSnap] = await Promise.all([
            supabase.from('system_rules').select('instruction').eq('agent_type', 'consultant').eq('is_active', true).catch(() => ({ data: [] })),
            // 🔥 הוספנו type: 'websearch' שמלמד את המסד לקרוא את הטקסט כמו שורת חיפוש בגוגל ולא כקוד
            supabase.from('inventory').select('*').textSearch('product_name', cleanSearchTerm, { type: 'websearch', config: 'hebrew' }).limit(5).catch(() => ({ data: [] })),
            getDocs(collection(dbFS, "knowledge_base")).catch(() => ({ docs: [] })) 
        ]);

        const rules = rulesRes?.data || [];
        const inv = invRes?.data || [];
        const cacheDocs = cacheSnap?.docs ? cacheSnap.docs.map(d => d.data()) : [];

        let knowledgeBaseText = "";
        if (cacheDocs.length > 0) {
            knowledgeBaseText = "\nמידע טכני מהמאגר שלנו (השתמש בזה כדי לחסוך חיפוש):\n" + 
                                cacheDocs.map(p => `- ${p.productName}: ${p.description} (תמונה אם יש: ${p.image_url || 'אין'})`).join("\n");
        }

        // 5. גוגל - רק אם אין במלאי הפנימי
        let googleSearchInfo: any = null;
        if (!inv || inv.length === 0) {
            googleSearchInfo = await getGoogleCseInfo(message);
        }

        // 6. הרכבת הפרומפט
        const consultantDNA = rules.map(r => r.instruction).join("\n") || "אתה יועץ טכני מקצועי של ח.סבן.";
        const productInfo = inv.length ? JSON.stringify(inv) : "המוצר לא נמצא במלאי הפנימי.";
        const googleContext = googleSearchInfo ? `\nמידע משלים מגוגל: ${googleSearchInfo.snippet}\nקישור: ${googleSearchInfo.link}\nלינק לתמונה מגוגל: ${googleSearchInfo.image || 'אין'}` : "";
        
        const prompt = `
        הנחיות התנהגות מול הלקוח הנוכחי (CRM):
        ${context || 'לקוח רגיל'}
        
        הנחיות יועץ (DNA מ-Supabase): ${consultantDNA}
        ${knowledgeBaseText}
        
        רשימת מוצרים מהמלאי בזמן אמת: ${productInfo}
        ${googleContext}
        
        תקצר משפט פתיחה ואל תתחנף תהיה פיקודי למבציע הזמנה למשתמש שהוזכר או מוגדר כלקוח או הזכיר הזמנה
        חוקי הצגת מוצרים ותמונות (חובה לציית):
        1. אם יש כמה מוצרים רלוונטיים, הצג אותם כרשימה מסודרת, קצרה וקולעת (שם, מחיר אם יש, ותיאור טכני קצר).
        2. תמונות: אם בנתונים של המוצר (מהמלאי או מגוגל) יש קישור לתמונה (URL), חובה לצרף את הקישור לשורה נפרדת מתחת לתיאור המוצר. אל תשתמש בסימון Markdown של תמונות.
        
        חוק קריטי: אם נעזרת ב"מידע משלים מגוגל" כדי ללמוד על מוצר חדש, חובה להוסיף בסוף התשובה שלך את השורה המדויקת הבאה כדי שנזכור זאת:
        [SAVE_PRODUCT: שם_המוצר | תקציר_טכני_של_שלוש_שורות | קישור_לתמונה_אם_יש]
        🚀חתימה: ראמי זמין וגם אם לא, דאג לי. יקבל את ההזמנה רק תאשר לי שיגור.
        
        שאלה: ${message}
        `;
        
        let lastError: any = null;
        let finalReply = "";
        let activeModel = "";

        // 7. לולאת מודלים
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
                } else if (data.error) {
                    throw new Error(data.error.message);
                }
            } catch (e: any) {
                lastError = e.message;
                continue; 
            }
        }

        if (!finalReply) throw new Error("All models failed: " + lastError);

        // 8. תפיסת מוצרים ושמירה
        const saveMatch = finalReply.match(/\[SAVE_PRODUCT:\s*(.*?)\s*\|\s*(.*?)(?:\s*\|\s*(.*?))?\]/);
        if (saveMatch) {
            const newProductName = saveMatch[1].trim();
            const newProductDesc = saveMatch[2].trim();
            const newProductImage = saveMatch[3] ? saveMatch[3].trim() : null;
            
            try {
                await addDoc(collection(dbFS, "knowledge_base"), {
                    productName: newProductName,
                    description: newProductDesc,
                    image_url: newProductImage !== 'אין' ? newProductImage : null,
                    addedAt: serverTimestamp(),
                    source: "google_search_cache"
                });
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
        console.error("🔥 API Error (500):", e.message);
        return res.status(500).json({ error: e.message });
    }
}
