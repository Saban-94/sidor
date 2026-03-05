// api/gemini.js - ה-Autopilot של ראמי מסארוה (ח. סבן)
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY;
    const { message, senderPhone } = req.body;

    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    // רשימת מודלים לפי סדר עדיפות (לפי עדכוני מרץ 2026)
    const modelPriority = [
        "gemini-3.1-flash-lite-preview", 
        "gemini-3-flash-preview",
        "gemini-1.5-flash"
    ];

    // הגדרת הזהות של הטייס האוטומטי
    const systemPrompt = `
    אתה ה"טייס האוטומטי" והעוזר האישי של ראמי מסארוה מחברת ח. סבן חומרי בניין 1994 בע"מ.
    תפקידך: לנהל הזמנות, לתאם משלוחי חול ובטון, ולענות ללקוחות בווטסאפ בשמו של ראמי.
    סגנון: מקצועי, ענייני, אדיב ומהיר. 
    אם הפנייה היא מראמי (+972508861080), פנה אליו כ"ראמי הבוס" ותן לו סטטוס לוגיסטי.
    אם הפנייה מלקוח אחר, ענה בשם "הצוות של ח. סבן".
    
    הודעה נכנסת: ${message}
    `;

    for (const modelName of modelPriority) {
        try {
            console.log(`🤖 מנסה להפעיל מודל: ${modelName}`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }]
                })
            });

            const data = await response.json();
            if (response.ok && data.candidates) {
                return res.status(200).json({ 
                    reply: data.candidates[0].content.parts[0].text, 
                    modelUsed: modelName 
                });
            }
        } catch (err) {
            console.warn(`⚠️ מודל ${modelName} נכשל, מדלג...`);
        }
    }
    return res.status(500).json({ error: "כל המודלים נכשלו בשרת גוגל" });
}
