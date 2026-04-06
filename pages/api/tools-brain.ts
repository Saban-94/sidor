import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const geminiKey = process.env.GEMINI_API_KEY;

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { message, senderPhone, imageUrl, imageBase64 } = req.body;
  const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'guest';
  const clientId = senderPhone || userIP;

  const SYSTEM_INSTRUCTIONS = `
    אתה המומחה הטכני של "ח.סבן חומרי בניין". 
    תפקידך: לנתח תמונות מהשטח ולאבחן תקלות בנייה.
    מילון מונחים ויזואלי:
    - סדק שיער: קו דק מאוד, טיפול בשפכטל.
    - סדק מבני: סדק עמוק/אלכסוני, דורש שיקום בטון.
    - ברזל חשוף: דורש ניקוי וסיקה 610/212.
    - רטיבות: כתמים כהים/קילופי צבע, דורש איטום (סיקה 107).
    
    בכל ניתוח תמונה:
    1. זהה את הבעיה.
    2. הסבר למה זה קרה.
    3. תן רשימת מוצרים וכמויות.
  `;

  try {
    // שליחת התמונה והטקסט ל-Gemini Vision
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: SYSTEM_INSTRUCTIONS + "\n\nהודעת המשתמש: " + message },
            ...(imageBase64 ? [{ inline_data: { mime_type: "image/jpeg", data: imageBase64 } }] : [])
          ]
        }]
      })
    });

    const data = await aiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "לא הצלחתי לנתח את התמונה, תוכל לתאר לי אותה?";

    // שמירת הניתוח בלוח הבקרה (למידה וירטואלית)
    if (imageBase64 && imageUrl) {
      await supabase.from('vision_analysis_logs').insert({
        clientId,
        image_url: imageUrl,
        analysis_result: reply,
        detected_issue: reply.includes("סדק") ? "סדק" : reply.includes("חלודה") ? "חלודה" : "אחר"
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: "טעות במוח הוויזואלי" });
  }
}
