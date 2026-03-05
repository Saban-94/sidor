export default async function handler(req, res) {
    // וידוא שהבקשה הגיעה בפורמט הנכון
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key in Vercel Environment' });

    try {
        const { message } = req.body;
        
        // קריאה למודל 3.1 החדש
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `אתה הטייס האוטומטי של ח. סבן חומרי בניין. ענה במקצועיות ללקוח: ${message}` }] }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content) {
            const reply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply });
        } else {
            throw new Error('Invalid response from Gemini');
        }
    } catch (error) {
        console.error("Internal Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
