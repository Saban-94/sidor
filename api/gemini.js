export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    const { message, senderPhone } = req.body;

    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    // הגדרת זהות הטייס האוטומטי עבור ראמי מסארוה
    const systemPrompt = `אתה העוזר האישי של ראמי מסארוה (972508861080) מחברת ח. סבן חומרי בניין. 
    ענה במקצועיות ובאדיבות. אם הפונה הוא ראמי, פנה אליו כ'ראמי הבוס'. 
    הודעה נכנסת מהלקוח: ${message}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        });

        const data = await response.json();
        if (response.ok && data.candidates) {
            return res.status(200).json({ 
                reply: data.candidates[0].content.parts[0].text,
                status: "success"
            });
        }
        throw new Error(data.error?.message || "Gemini Error");
    } catch (err) {
        return res.status(500).json({ error: err.message, status: "failed" });
    }
}
