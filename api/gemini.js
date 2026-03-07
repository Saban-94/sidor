import { createClient } from '@supabase/supabase-js';

// חיבור מאובטח ל-Supabase באמצעות מפתחות מה-Environment Variables
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY;
    const { message } = req.body;

    // 1. הגנות ראשוניות למניעת שגיאות 400/500
    if (!message) return res.status(400).json({ error: "Missing message" });
    if (!apiKey) return res.status(500).json({ error: "API_KEY_MISSING" });

    // 2. בריכת מודלים מעודכנת (מרץ 2026) לניצול מכסה חינמית וביצועים
    const modelPool = [
        "gemini-3.1-flash-lite-preview", // עדיפות 1: הכי מהיר וחסכוני (הושק 03.03.2026)
        "gemini-3.1-flash-preview",      // עדיפות 2: מאוזן וחזק
        "gemini-2.0-flash-exp"          // עדיפות 3: גיבוי יציב
    ];

    try {
        // 3. שליפה מקבילית של DNA היועץ ונתוני המלאי לחיסכון בזמן (Latency)
        const [{ data: rules }, { data: inv }] = await Promise.all([
            supabase.from('system_rules')
                .select('instruction')
                .eq('agent_type', 'consultant')
                .eq('is_active', true),
            supabase.from('inventory')
                .select('*')
                .textSearch('product_name', message, { config: 'hebrew' })
                .limit(1)
        ]);
        
        const consultantDNA = rules?.map(r => r.instruction).join("\n") || "אתה יועץ טכני מקצועי של ח. סבן.";
        const productInfo = inv?.length ? JSON.stringify(inv) : "המוצר לא נמצא במאגר המדויק, ענה לפי ידע מקצועי כללי.";
        
        const prompt = `הנחיות יועץ: ${consultantDNA}\nנתוני מלאי רלוונטיים: ${productInfo}\nשאלה טכנית מהלקוח: ${message}`;
        
        let lastError = null;

        // 4. לוגיקת Failover חכמה: מעבר בין מודלים אם המכסה הסתיימה
        for (const modelName of modelPool) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { 
                            temperature: 0.2, // טמפרטורה נמוכה לדיוק טכני מרבי
                            maxOutputTokens: 800 
                        }
                    })
                });

                const data = await response.json();
                
                // בדיקה שהתשובה חזרה תקינה מה-AI
                if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                    return res.status(200).json({ 
                        reply: data.candidates[0].content.parts[0].text,
                        products: inv,
                        activeModel: modelName,
                        status: "success"
                    });
                } else if (data.error) {
                    lastError = data.error.message;
                    console.warn(`Model ${modelName} failed: ${lastError}`);
                    continue; // ניסיון מודל הבא בבריכה
                }
            } catch (e) {
                lastError = e.message;
                continue; 
            }
        }

        throw new Error("All models failed to provide a response: " + lastError);

    } catch (e) {
        console.error("Consultant Critical Error:", e.message);
        return res.status(500).json({ error: e.message });
    }
}
