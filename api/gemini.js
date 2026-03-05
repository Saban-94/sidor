// /api/gemini.js - המוח של Saban AI Studio
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // שליפת המפתח ממשתני הסביבה (Environment Variables)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const { message, senderPhone, context } = req.body;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API Key is missing in environment variables' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    // הגדרת ה"אישיות" של המוח (System Instruction)
    const prompt = {
        contents: [{
            parts: [{
                text: `אתה העוזר הלוגיסטי החכם של חברת "ח. סבן חומרי בניין". 
                הלקוח או המנהל (ראמי) שלח הודעה: "${message}".
                התפקיד שלך:
                1. אם זו הזמנת חומרים (חול, מנוף, מלט), נסח אותה בצורה מסודרת לסידור העבודה.
                2. אם ההודעה מגיעה מראמי (+972508861080), התייחס אליו כבוס ותן תשובה תפעולית.
                3. שמור על טון מקצועי, קצר וענייני.
                הקשר קודם: ${context || 'אין היסטוריה קודמת'}`
            }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prompt)
        });

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        // החזרת התשובה לממשק
        return res.status(200).json({ reply: aiResponse });

    } catch (error) {
        return res.status(500).json({ error: 'Failed to connect to Gemini', details: error.message });
    }
}
