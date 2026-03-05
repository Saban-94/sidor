// gemini-bridge.js
export async function processPrivateToBusiness(message, geminiApiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    const prompt = {
        contents: [{
            parts: [{
                text: `אתה עוזר לוגיסטי של ח. סבן. ראמי שלח הודעה מהנייד הפרטי שלו: "${message}". 
                נתח את ההודעה ואם זו הזמנה, נסח אותה מחדש בצורה מקצועית לסידור העבודה.`
            }]
        }]
    };

    const response = await fetch(url, { method: 'POST', body: JSON.stringify(prompt) });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}
