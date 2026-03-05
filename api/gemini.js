export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    const { message, senderPhone } = req.body;

    if (!apiKey) return res.status(500).json({ error: 'Missing API Key in Vercel settings' });

    // הגדרת זהות הטייס האוטומטי של ראמי מסארוה
    const systemPrompt = `אתה העוזר האישי של ראמי מסארוה (972508861080) מחברת ח. סבן חומרי בניין. 
    ענה במקצועיות ובאדיבות. אם הפונה הוא ראמי, פנה אליו כ'ראמי הבוס'. 
    הודעה נכנסת: ${message}`;

    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];

    for (const model of models) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
            });

            const data = await response.json();
            if (response.ok && data.candidates) {
                return res.status(200).json({ 
                    reply: data.candidates[0].content.parts[0].text,
                    modelUsed: model 
                });
            }
        } catch (err) {
            console.error(`מודל ${model} נכשל`);
        }
    }
    return res.status(500).json({ error: "כל המודלים נכשלו" });
}
