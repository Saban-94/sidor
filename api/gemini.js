import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY;
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: "Missing message" });
    if (!apiKey) return res.status(500).json({ error: "API_KEY_MISSING" });

    // בריכת מודלים מעודכנת (2026) - סדר עדיפויות לפי מהירות ועלות
    const modelPool = [
        "gemini-3.1-flash-lite-preview", // המהיר והחסכוני ביותר
        "gemini-3.1-flash-preview",      // חזק יותר
        "gemini-2.0-flash-exp"          // גיבוי יציב
    ];

    try {
        // 1. שליפת DNA של היועץ מהטבלה החדשה
        const { data: rules } = await supabase.from('system_rules')
            .select('instruction')
            .eq('agent_type', 'consultant')
            .eq('is_active', true);
        
        const consultantDNA = rules?.map(r => r.instruction).join("\n") || "אתה יועץ טכני מקצועי.";

        // 2. בדיקת מלאי רלוונטית
        const { data: inv } = await supabase.from('inventory')
            .select('*')
            .textSearch('product_name', message, { config: 'hebrew' })
            .limit(1);

        const prompt = `הנחיות יועץ: ${consultantDNA}\nנתוני מלאי: ${JSON.stringify(inv || [])}\nשאלה: ${message}`;
        
        let lastError = null;
        
        // 3. לוגיקת Failover למודלים
        for (const modelName of modelPool) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.2 } // דיוק גבוה לייעוץ טכני
                    })
                });

                const data = await response.json();
                
                if (data.candidates && data.candidates[0].content.parts[0].text) {
                    return res.status(200).json({ 
                        reply: data.candidates[0].content.parts[0].text,
                        products: inv,
                        activeModel: modelName
                    });
                }
            } catch (e) {
                lastError = e.message;
                continue; // מנסה את המודל הבא בבריכה
            }
        }

        throw new Error("All models failed: " + lastError);

    } catch (e) {
        console.error("Consultant Error:", e.message);
        return res.status(500).json({ error: e.message });
    }
}
