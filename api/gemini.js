// api/gemini.js
export default async function handler(req, res) {
    // מאפשר גישה מכל מקום (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const { message } = req.body;
        
        // שימוש במודל שראינו שעובד לך בבדיקה
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `אתה עוזר לוגיסטי בחברת ח.סבן. נתח והשב על: ${message}` }] }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const reply = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Brain Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
