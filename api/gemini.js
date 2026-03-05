export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY;
    const { message, senderPhone } = req.body;

    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    // רשימת מודלים לפי סדר עדיפות - מעודכן למרץ 2026
    const modelPriority = [
        "gemini-3.1-flash-lite-preview", // החדש ביותר (מרץ 2026)
        "gemini-3.1-pro-preview",       // הכי חכם (פברואר 2026)
        "gemini-3-flash-preview",       // יציב ומהיר
        "gemini-1.5-flash"              // גיבוי אחרון
    ];

    const systemPrompt = `אתה העוזר של חברת ח. סבן חומרי בניין. הבוס הוא ראמי (972508861080). 
    ענה במקצועיות. הודעה מהלקוח: ${message}`;

    // לוגיקה מדלגת: מנסה כל מודל עד שמצליח
    for (const model of modelPriority) {
        try {
            console.log(`🤖 מנסה מודל: ${model}`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
            });

            const data = await response.json();
            if (response.ok && data.candidates) {
                return res.status(200).json({ 
                    reply: data.candidates[0].content.parts[0].text,
                    status: "success",
                    activeModel: model 
                });
            }
        } catch (err) {
            console.error(`❌ מודל ${model} נכשל, עובר לבא בתור...`);
        }
    }

    return res.status(500).json({ error: "כל המודלים נכשלו בשרת גוגל", status: "failed" });
}
