import { createClient } from '@supabase/supabase-js';

// חיבור למאגר SIDOR
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY;
    const { message, context = "technical_advice" } = req.body;

    if (!apiKey) return res.status(500).json({ error: "API_KEY_MISSING" });

    try {
        // 1. לימוד מהמאגר: חיפוש מוצרים רלוונטיים ב-Supabase לפני המענה
        const { data: products } = await supabase
            .from('inventory')
            .select('product_name, consumption_per_mm, application_method, dry_time_hours')
            .textSearch('product_name', message, { config: 'hebrew' })
            .limit(2);

        const knowledgeBase = products?.length 
            ? `מידע מהמאגר שלנו: ${JSON.stringify(products)}` 
            : "לא נמצא מוצר ספציפי במאגר, השתמש בידע כללי של חומרי בניין.";

        // 2. פנייה ל-Gemini 3.1 עם הקשר (Context) של SIDOR
        const model = "gemini-3.1-flash-lite-preview";
        const systemPrompt = `אתה היועץ הטכני של ח. סבן. תפקידך: לתת הדרכה על יישום חומרים. 
        ${knowledgeBase}
        ענה בקצרות, במקצועיות, והתמקד בנתונים טכניים (זמני ייבוש, עובי שכבה).`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: `${systemPrompt}\n\nשאלה: ${message}` }] }
                ]
            })
        });

        const data = await response.json();
        const aiReply = data.candidates[0].content.parts[0].text;

        // 3. תקשורת בין מודלים: החזרת תשובה מובנית לביצועיסט
        return res.status(200).json({ 
            reply: aiReply,
            recommendation: products?.[0] || null,
            status: "success"
        });

    } catch (e) {
        return res.status(500).json({ error: "CONSULTANT_FAIL", detail: e.message });
    }
}
