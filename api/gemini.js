export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY; // משיכה מאובטחת מהשרת
    const { message, senderPhone } = req.body;

    if (!apiKey) return res.status(500).json({ error: "API_KEY_MISSING", detail: "המפתח לא מוגדר ב-Vercel" });

    // מודל Gemini 3.1 Flash-Lite (מרץ 2026)
    const model = "gemini-3.1-flash-lite-preview"; 

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
        });
        const data = await response.json();
        
        if (data.error) return res.status(401).json({ error: "API_KEY_INVALID", detail: data.error.message });

        return res.status(200).json({ 
            reply: data.candidates[0].content.parts[0].text,
            status: "success",
            model: model
        });
    } catch (e) {
        return res.status(500).json({ error: "NETWORK_FAIL", detail: e.message });
    }
}
