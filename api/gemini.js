export default async function handler(req, res) {
    console.log("🔍 מלשינון: בקשה נכנסה למוח...");
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const apiKey = process.env.GEMINI_API_KEY;
    const { message, senderPhone } = req.body;

    if (!apiKey) {
        console.error("❌ מלשינון כשל: מפתח API חסר ב-Vercel");
        return res.status(500).json({ error: "חסר מפתח API" });
    }

    // הגדרת המודלים החדשים ביותר למרץ 2026
    const models = ["gemini-3.1-flash-lite-preview", "gemini-1.5-flash"];
    let replySent = false;

    for (const model of models) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `אתה העוזר של ח.סבן. הבוס הוא ראמי. הודעה: ${message}` }] }]
                })
            });

            const data = await response.json();
            if (response.ok && data.candidates) {
                console.log(`✅ מלשינון: מודל ${model} ענה בהצלחה`);
                return res.status(200).json({ 
                    reply: data.candidates[0].content.parts[0].text,
                    modelUsed: model 
                });
            }
        } catch (e) {
            console.warn(`⚠️ מלשינון: מודל ${model} נכשל, מנסה בא בתור...`);
        }
    }
    res.status(500).json({ error: "כל המודלים נכשלו" });
}
