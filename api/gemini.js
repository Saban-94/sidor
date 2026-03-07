import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY;
    const { message } = req.body;

    try {
        // 1. שליפת חוקי יועץ מהטבלה
        const { data: rules } = await supabase.from('system_rules')
            .select('instruction').eq('agent_type', 'consultant').eq('is_active', true);
        const consultantDNA = rules?.map(r => r.instruction).join("\n") || "";

        // 2. בדיקת מלאי לטובת הייעוץ
        const { data: inv } = await supabase.from('inventory')
            .select('*').textSearch('product_name', message, { config: 'hebrew' }).limit(1);

        const model = "gemini-3.1-flash-lite-preview";
        const prompt = `הנחיות יועץ: ${consultantDNA}\nנתוני מלאי: ${JSON.stringify(inv)}\nשאלה: ${message}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        return res.status(200).json({ 
            reply: data.candidates[0].content.parts[0].text,
            products: inv 
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
