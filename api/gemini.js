import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// פונקציית שחקן חיזוק - מנוע חיפוש גוגל מותאם
async function getGoogleCseInfo(query) {
    const cx = "1340c66f5e73a4076"; // המזהה שסיפקת
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
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

export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY;
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: "Missing message" });
    if (!apiKey) return res.status(500).json({ error: "API_KEY_MISSING" });

    const modelPool = [
        "gemini-3.1-flash-lite-preview",
        "gemini-3.1-flash-preview",
        "gemini-2.0-flash-exp"
    ];

    try {
        // 1. שליפה מקבילית של DNA ומלאי
        const [{ data: rules }, { data: inv }] = await Promise.all([
            supabase.from('system_rules').select('instruction').eq('agent_type', 'consultant').eq('is_active', true),
            supabase.from('inventory').select('*').textSearch('product_name', message, { config: 'hebrew' }).limit(1)
        ]);
        
        // 2. הפעלת שחקן חיזוק (גוגל) אם המוצר לא נמצא במלאי האמת
        let googleSearchInfo = null;
        if (!inv || inv.length === 0) {
            googleSearchInfo = await getGoogleCseInfo(message);
        }

        const consultantDNA = rules?.map(r => r.instruction).join("\n") || "אתה יועץ טכני מקצועי של ח. סבן.";
        const productInfo = inv?.length ? JSON.stringify(inv) : "המוצר לא במאגר.";
        const googleContext = googleSearchInfo ? `\nמידע משלים מגוגל: ${googleSearchInfo.snippet}\nקישור לתמונה/מידע: ${googleSearchInfo.image || googleSearchInfo.link}` : "";
        
        const prompt = `הנחיות יועץ: ${consultantDNA}\nנתוני מלאי: ${productInfo}${googleContext}\nשאלה: ${message}`;
        
        let lastError = null;

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
                    return res.status(200).json({ 
                        reply: data.candidates[0].content.parts[0].text,
                        products: inv,
                        googleInfo: googleSearchInfo,
                        activeModel: modelName
                    });
                }
            } catch (e) {
                lastError = e.message;
                continue; 
            }
        }
        throw new Error("All models failed: " + lastError);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
