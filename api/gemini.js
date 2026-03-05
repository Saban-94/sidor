export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const apiKey = process.env.GEMINI_API_KEY;
    const { message, senderPhone } = req.body;

    const systemPrompt = `אתה הטייס האוטומטי של חברת ח. סבן חומרי בניין. 
    הבוס הוא ראמי מסארוה. ענה ללקוחות במקצועיות ובאדיבות.
    הודעה נכנסת לווטסאפ העסקי (+972508860896): ${message}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        });
        const data = await response.json();
        return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
    } catch (e) {
        return res.status(500).json({ error: "כשל במוח" });
    }
}
