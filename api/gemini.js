export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY;
    const { message, senderPhone } = req.body;

    // המודל הכי חדש ויציב למרץ 2026
    const model = "gemini-3.1-flash-lite-preview"; 

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `אתה הטייס האוטומטי של ח.סבן חומרי בניין. הבוס הוא ראמי. הודעה מלקוח: ${message}` }] }]
            })
        });
        const data = await response.json();
        return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } catch (e) {
        return res.status(500).json({ error: "כשל בתקשורת מול המוח" });
    }
}
