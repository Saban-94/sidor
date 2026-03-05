export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY;
    const { message, senderPhone } = req.body;

    if (!apiKey) return res.status(500).json({ error: 'Missing API Key in Vercel' });

    // מנגנון דילוג (Fallback) בין מודלים
    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];
    
    let systemPrompt = `אתה העוזר האישי של ראמי מסארוה מחברת ח. סבן חומרי בניין. 
    הטלפון של ראמי הוא 972508861080. אם ההודעה ממנו, פנה אליו כ'ראמי הבוס'. 
    לכל שאר הלקוחות ענה במקצועיות ובאדיבות בשם 'צוות ח. סבן'. 
    הודעה נכנסת: ${message}`;

    for (const model of models) {
        try {
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
                    model: model 
                });
            }
        } catch (err) {
            console.error(`מודל ${model} נכשל, מנסה הבא...`);
        }
    }
    return res.status(500).json({ error: "Failure in all models" });
}
