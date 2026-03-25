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
    // רק פניות POST
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY;
    const { message, context } = req.body; 

    // 🔥 טריק: מחזירים שגיאה ישירות לצ'אט כדי שראמי יראה מה חסר
    if (!message) return res.status(200).json({ reply: "אחי, קיבלתי הודעה ריקה. תנסה שוב." });
    if (!apiKey) return res.status(200).json({ reply: "⚠️ ראמי, חסר מפתח GEMINI_API_KEY ב-Vercel! השרת לא יכול לדבר עם המוח." });
    if (!supabaseUrl || !supabaseKey) return res.status(200).json({ reply: "⚠️ ראמי, חסרים מפתחות של Supabase ב-Vercel! לא יכול לשלוף מלאי." });

    const modelPool = [
        "gemini-2.0-flash",       
        "gemini-1.5-flash",       
        "gemini-1.5-pro"          
    ];

    try {
        // מסנן מילות קישור לשליפה מדויקת מהמלאי (Stop Words Filter)
        const stopWords = ['יש', 'לכם', 'אני', 'צריך', 'מחפש', 'האם', 'איפה', 'מה', 'כמה', 'איך', 'לי', 'לו', 'את', 'של', 'על', 'עם', 'ב', 'ל', 'ה', 'ו', 'תביא', 'תארגן', 'מקט', 'מק"ט'];
        const cleanSearchTerm = message
            .replace(/[^\w\sא-ת]/gi, ' ') 
            .split(/\s+/)
            .filter((w: string) => !stopWords.includes(w) && w.length > 1)
            .join(' ')
            .trim();

        let inv: any[] = [];
        let rules: any[] = [];
        
        // נחפש במלאי רק אם נשארו מילים אמיתיות לחיפוש
        if (cleanSearchTerm.length > 0) {
            
            const fetchRules = async () => {
                try { 
                    const res = await supabase.from('system_rules').select('instruction').eq('agent_type', 'consultant').eq('is_active', true); 
                    return res.error ? { data: [] } : res;
                } catch { return { data: [] }; }
            };
            
            const fetchInv = async () => {
                try { 
                    // 🔥 הוסר config: 'hebrew' שגרם לקריסות פוסטגרס. חיפוש נקי ויציב.
                    const res = await supabase.from('inventory').select('*').textSearch('product_name', cleanSearchTerm, { type: 'websearch' }).limit(5); 
                    return res.error ? { data: [] } : res;
                } catch { return { data: [] }; }
            };

            const [rulesRes, invRes] = await Promise.all([fetchRules(), fetchInv()]);
            
            inv = invRes?.data || [];
            rules = rulesRes?.data || [];
        }

        // 4. שליפת ידע מהזיכרון
        const cacheSnap = await getDocs(collection(dbFS, "knowledge_base")).catch(() => ({ docs: [] }));
        const cacheDocs = cacheSnap?.docs ? cacheSnap.docs.map(d => d.data()) : [];

        let knowledgeBaseText = "";
        if (cacheDocs.length > 0) {
            knowledgeBaseText = "\nמידע טכני מהמאגר שלנו (השתמש בזה כדי לחסוך חיפוש):\n" + 
                                cacheDocs.map(p => `- ${p.productName}: ${p.description}`).join("\n");
        }

        // 5. גוגל - רק אם אין במלאי הפנימי בכלל
        let googleSearchInfo: any = null;
        if (!inv || inv.length === 0) {
            googleSearchInfo = await getGoogleCseInfo(message);
        }

        // 6. הרכבת הפרומפט
        const consultantDNA = rules.length ? rules.map((r: any) => r.instruction).join("\n") : "אתה יועץ טכני של ח. סבן.";
        const productInfo = inv.length ? JSON.stringify(inv) : "המוצר לא נמצא במלאי הפנימי.";
        const googleContext = googleSearchInfo ? `\nמידע משלים מגוגל: ${googleSearchInfo.snippet}\nקישור: ${googleSearchInfo.link}\nלינק לתמונה: ${googleSearchInfo.image || 'אין'}` : "";
        
        const prompt = `
        הנחיות התנהגות מול הלקוח הנוכחי (מתוך ה-CRM):
        ${context || 'לקוח רגיל'}
        
        מידע נוסף: ${knowledgeBaseText}
        
        רשימת מוצרים שנשלפו מהמלאי בזמן אמת: 
        ${productInfo}
        
        ${googleContext}
        
        --- חוקי ברזל חמורים (חובה לציית) ---
        1. תקצר משפט פתיחה, אל תתחנף, ענה לעניין לפי הטון שהוגדר לך.
        2. חוק אפס המצאות (Zero Hallucination): אם המוצר לא מופיע ב"רשימת מוצרים מהמלאי בזמן אמת", **אסור לך להמציא סיבות שקריות**. פעל לפי החוק שהוגדר לך למקרה של חוסרים.
        3. אם מצאת מוצר במלאי, אל תכתוב מפרט ארוך. תן משפט סיום: "צירפתי לך למטה את כרטיס המוצר עם תמונה, סרטון ומחשבון כמויות."
        4. אם נעזרת בגוגל למוצר חדש, חובה להוסיף בסוף התשובה: [SAVE_PRODUCT: שם_המוצר | תקציר_טכני | קישור_לתמונה]
        
        🚀 חתימה לכל הודעה: ראמי זמין וגם אם לא, דאג לי. יקבל את ההזמנה רק תאשר לי שיגור.
        
        שאלת הלקוח: ${message}
        `;
        
        let lastError: any = null;
        let finalReply = "";
        let activeModel = "";

        // 7. לולאת מודלים (Fallback)
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

        if (!finalReply) throw new Error("כל המודלים של ג'מיני קרסו: " + lastError);

        // 8. תפיסת מוצרים חדשים ושמירה
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
        console.error("🔥 API Error:", e.message);
        // במקום להקריס את האפליקציה ב-500, נחזיר את השגיאה בתוך הודעה מסודרת לצ'אט!
        return res.status(200).json({ 
            reply: `⚠️ ראמי, יש לי שגיאת שרת פנימית (500). זה מה שקרס: ${e.message}` 
        });
    }
}
