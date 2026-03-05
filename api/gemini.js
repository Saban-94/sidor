export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY;
    const { message, senderPhone } = req.body;

    // מלשינון Backend
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key in Vercel settings' });

    const systemPrompt = `אתה העוזר החכם של חברת ח. סבן חומרי בניין. 
    הבוס שלך הוא ראמי (מספר: 972508861080). 
    תפקידך: לתת שירות לקוחות מהיר, מקצועי ואדיב. 
    אם הפונה הוא ראמי, ענה בקיצור ובכבוד. 
    הודעה מהלקוח: ${message}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            return res.status(200).json({ 
                reply: data.candidates[0].content.parts[0].text,
                success: true 
            });
        } else {
            throw new Error(data.error?.message || "No candidates from Gemini");
        }
    } catch (error) {
        console.error("Gemini Error:", error);
        return res.status(500).json({ error: error.message, success: false });
    }
}
