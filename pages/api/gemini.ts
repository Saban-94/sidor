import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
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

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const { message, context } = req.body; 

    if (!message) return res.status(200).json({ reply: "אחי, קיבלתי הודעה ריקה. תנסה שוב." });
    if (!apiKey) return res.status(200).json({ reply: "⚠️ ראמי, חסר מפתח GEMINI_API_KEY ב-Vercel! השרת לא יכול לדבר עם המוח." });
    if (!supabaseUrl || !supabaseKey) return res.status(200).json({ reply: "⚠️ ראמי, חסרים מפתחות של Supabase ב-Vercel! לא יכול לשלוף מלאי." });

    const modelPool = [
        "gemini-3.1-flash-lite-preview",
        "gemini-1.5-flash",         
        "gemini-1.5-flash-latest",  
        "gemini-pro"                
    ];

    try {
        // 🔥 הוספת מילות אריזה/כמויות לסינון כדי שהחיפוש במלאי יהיה מדויק ונטו על שם המוצר
        const systemConfigSnap = await getDoc(doc(dbFS, "system", "search_config")).catch(() => null);
        const dbStopWords = systemConfigSnap?.exists() ? systemConfigSnap.data().stopWords : null;
        
        const defaultStopWords = [
            'רוצה', 'להזמין', 'לקנות', 'יש', 'לכם', 'אני', 'צריך', 'מחפש', 'האם', 'איפה', 'מה', 'כמה', 'איך', 'לי', 'לו', 'את', 'של', 'על', 'עם', 'ב', 'ל', 'ה', 'ו', 'תביא', 'תארגן', 'מקט', 'מק"ט',
            'שק', 'שקי', 'שקים', 'משטח', 'משטחי', 'משטחים', 'דלי', 'דליים', 'פח', 'פחים', 'חבילה', 'חבילות', 'יחידות', 'יח'
        ];
        const stopWords = dbStopWords || defaultStopWords;
        
        const cleanSearchTerm = message
            .replace(/[^\w\sא-ת]/gi, ' ') 
            .split(/\s+/)
            .filter((w: string) => !stopWords.includes(w) && w.length > 1) // מנפה מספרים כמו "3" ומילות סינון
            .join(' ')
            .trim();

        let inv: any[] = [];
        let rules: any[] = [];
        
        if (cleanSearchTerm.length > 0) {
            const fetchRules = async () => {
                try { 
                    const res = await supabase.from('system_rules').select('instruction').eq('agent_type', 'consultant').eq('is_active', true); 
                    return res.error ? { data: [] } : res;
                } catch { return { data: [] }; }
            };
            
            const fetchInv = async () => {
                try { 
                    const res = await supabase.from('inventory').select('*').textSearch('product_name', cleanSearchTerm, { type: 'websearch' }).limit(5); 
                    return res.error ? { data: [] } : res;
                } catch { return { data: [] }; }
            };

            const [rulesRes, invRes] = await Promise.all([fetchRules(), fetchInv()]);
            
            inv = invRes?.data || [];
            rules = rulesRes?.data || [];
        }

        const cacheSnap = await getDocs(collection(dbFS, "knowledge_base")).catch(() => ({ docs: [] }));
        const cacheDocs = cacheSnap?.docs ? cacheSnap.docs.map(d => d.data()) : [];

        let knowledgeBaseText = "";
        if (cacheDocs.length > 0) {
            knowledgeBaseText = "\nמידע טכני מהמאגר שלנו (השתמש בזה כדי לחסוך חיפוש):\n" + 
                                cacheDocs.map(p => `- ${p.productName}: ${p.description}`).join("\n");
        }

        let googleSearchInfo: any = null;
        if (!inv || inv.length === 0) {
            googleSearchInfo = await getGoogleCseInfo(message);
        }

        const consultantDNA = rules.length ? rules.map((r: any) => r.instruction).join("\n") : "היה יועץ טכני מקצועי.";
        const productInfo = inv.length ? JSON.stringify(inv) : "המוצר לא נמצא במלאי הפנימי.";
        const googleContext = googleSearchInfo ? `\nמידע משלים מגוגל: ${googleSearchInfo.snippet}\nקישור: ${googleSearchInfo.link}\nלינק לתמונה: ${googleSearchInfo.image || 'אין'}` : "";
        
        // 🔥 עדכון ה-DNA למניעת לולאת חפירות
        const prompt = `
        הזהות שלך: אתה ראמי, מנהל התפעול והלוגיסטיקה בחברת ח. סבן חומרי בניין. 
        הלקוח פונה אליך! לעולם אל תפנה ללקוח בשם "ראמי".

        הנחיות התנהגות מול הלקוח הנוכחי (מתוך ה-CRM):
        ${context || 'דבר בגובה העיניים, קצר, מקצועי ובשפת קבלנים.'}
        
        מידע טכני מה-DNA שלך: ${consultantDNA}
        ${knowledgeBaseText}
        
        רשימת מוצרים שנשלפו מהמלאי בזמן אמת: 
        ${productInfo}
        
        ${googleContext}
        
        --- חוקי ברזל חמורים (חובה לציית) ---
        1. תקצר משפט פתיחה, אל תתחנף, תענה ישירות ולעניין. **אל תגיד 'שלום', 'אהלן' או 'מה נשמע' אם הלקוח מבקש מוצר כחלק מרצף שיחה. פשוט תן לו את הנתון.**
        2. התמודדות עם חוסרים (קריטי): אם המוצר לא נמצא ב"רשימת מוצרים מהמלאי בזמן אמת", אסור לך להמציא תירוצים. ענה: "אהלן אחי, [שם המוצר שחיפש] לא נמצא לי כרגע במלאי. אני בודק לך מול הספקים אלטרנטיבה ומעדכן."
        3. אם מצאת מוצר במלאי, אל תכתוב מפרט ארוך בגוף ההודעה. תן משפט קצר שמסכם את המחיר/כמות וסיים עם: "צירפתי לך למטה את כרטיס המוצר עם תמונה, סרטון ומחשבון כמויות."
        4. אם נעזרת בגוגל למוצר חדש, חובה להוסיף בסוף התשובה (בשורה נפרדת): [SAVE_PRODUCT: שם_המוצר | תקציר_טכני | קישור_לתמונה]
        
        🚀 חתימה לכל הודעה (הוסף תמיד בסוף): ראמי זמין וגם אם לא, דאג לי. יקבל את ההזמנה רק תאשר לי שיגור.
        
        שאלת הלקוח: ${message}
        `;
        
        let errorLogs: string[] = [];
        let finalReply = "";
        let activeModel = "";

        // לולאת גיבוי
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
                errorLogs.push(`${modelName}: ${e.message}`);
                continue; 
            }
        }

        if (!finalReply) throw new Error("קריסת מודלים מוחלטת | " + errorLogs.join(" | "));

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
        return res.status(200).json({ 
            reply: `⚠️ ראמי, יש לי שגיאת שרת (500). פירוט מלא: ${e.message}` 
        });
    }
}
