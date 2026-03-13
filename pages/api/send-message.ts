// /pages/api/send-message.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // חסימת שיטות שהן לא POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, text } = req.body;

  // בדיקת תקינות בסיסית של הקלט
  if (!phone || !text) {
    return res.status(400).json({ error: 'Phone and text are required' });
  }

  // הכתובת המעודכנת מה-ngrok שלך
  const JONI_URL = "https://occupational-nonchromatically-jamal.ngrok-free.dev/send";
  const JONI_ENDPOINT = `${NGROK_BASE_URL}/send`;

  // ניקוי מספר הטלפון (משאיר רק ספרות)
  const cleanPhone = phone.toString().replace(/\D/g, '');

  try {
    // הגדרת טיימאאוט כדי שהשרת לא ייתקע אם ngrok לא מגיב
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(JONI_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // חיוני: מדלג על דף האזהרה של ngrok שחוסם בקשות API בתוכנית החינמית
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'SabanOS-Bot'
      },
      body: JSON.stringify({
        number: cleanPhone,
        message: text
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // בדיקה אם JONI החזיר שגיאה (למשל מספר לא תקין או ניתוק מוואטסאפ)
    if (!response.ok) {
      const errorText = await response.text();
      console.error('JONI Response Error:', errorText);
      return res.status(response.status).json({ 
        error: 'JONI connection failed', 
        details: errorText 
      });
    }

    // הצלחה
    return res.status(200).json({ success: true, target: cleanPhone });

  } catch (error: any) {
    console.error('API Route Error:', error);

    // טיפול ספציפי במקרה של ניתוק המנהרה (Tunnel Offline)
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request Timeout - JONI/ngrok is too slow' });
    }

    return res.status(502).json({ 
      error: 'Gateway Error - Is ngrok running?', 
      details: error.message 
    });
  }
}
