// api/gemini.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY;
    const { message } = req.body;

    if (!apiKey) return res.status(500).json({ error: 'Missing API Key in Environment Variables' });

    // רשימת מודלים לפי סדר עדיפות (מהחדש והחכם ביותר ליציב ביותר)
    const modelPriority = [
        "gemini-3.1-flash-lite-preview", // הושק ב-3 במרץ 2026
        "gemini-3-flash-preview",
        "gemini-1.5-flash",             // Fallback יציב
        "gemini-1.5-flash-8b"           // מהיר במיוחד
    ];

    let lastError = null;

    // לולאת הדילוג בין המודלים
    for (const modelName of modelPriority) {
        try {
            console.log(`🤖 מנסה להפעיל מודל: ${modelName}`);
            
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `אתה מנהל לוגיסטי בכיר בחברת ח.סבן חומרי בניין. ענה לראמי או ללקוח בצורה מקצועית, קצרה ועניינית: ${message}` }]
                    }]
                })
            });

            const data = await response.json();

            if (response.ok && data.candidates && data.candidates[0].content) {
                const reply = data.candidates[0].content.parts[0].text;
                return res.status(200).json({ 
                    reply, 
                    modelUsed: modelName,
                    status: "success" 
                });
            } else {
                lastError = data.error ? data.error.message : "Response not ok";
                console.warn(`⚠️ מודל ${modelName} נכשל: ${lastError}`);
            }

        } catch (err) {
            lastError = err.message;
            console.error(`❌ תקלה טכנית במודל ${modelName}:`, lastError);
        }
    }

    return res.status(500).json({ error: "כל המודלים נכשלו", details: lastError });
}
