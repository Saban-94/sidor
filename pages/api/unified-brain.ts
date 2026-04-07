import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, imageBase64, senderPhone } = req.body;
  const cleanMsg = message?.trim();

  if (!cleanMsg && !imageBase64) {
    return res.status(200).json({ reply: "בוס, לא שלחת כלום. איך אני יכול לעזור?", success: false });
  }

  try {
    // 1. איסוף הקשר (Context) מהטבלאות ב-Supabase
    let context = "";
    
    // משיכת נתוני מכולות וסידור עבודה
    const { data: containers } = await supabase.from('containers').select('*');
    if (containers) {
      context += "סטטוס מכולות: " + containers.map(c => `מכולה ${c.id}: ${c.status}`).join(", ") + ". ";
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: sidor } = await supabase.from('sidor_entries').select('*').eq('date', today);
    if (sidor && sidor.length > 0) {
      context += "סידור להיום: " + sidor.map(s => `${s.driver}: ${s.task}`).join(" | ") + ". ";
    }

    // 2. הכנת הבקשה ל-Gemini עם דגש על פלט JSON מובנה
    const model = imageBase64 ? "gemini-3.1-flash-lite-preview" : "gemini-2.0-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `
      אתה המוח של 'ה. סבן חומרי בניין'. ענה בסגנון מקצועי וחברי ('אח על מלא').
      אם המשתמש מבקש להזמין מוצר (גם אם זה מתמונה), עליך לזהות זאת.
      
      עליך להחזיר אך ורק JSON במבנה הבא:
      {
        "reply": "התשובה הטקסטואלית שלך ללקוח",
        "orderPlaced": true/false (האם זוהתה הזמנה),
        "items": "שם המוצר והכמות שזוהו (למשל: 3 שקי טיט)",
        "success": true
      }
      
      הקשר מהמערכת: ${context}
    `;

    // בניית תוכן ההודעה (טקסט + תמונה אם קיימת)
    const parts: any[] = [{ text: `הודעת המשתמש: ${cleanMsg || "ניתוח תמונה"}` }];
    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: imageBase64.split(",")[1] // הסרת ה-Prefix של ה-Base64
        }
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const aiData = await response.json();
    const result = JSON.parse(aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}");

    // 3. תיעוד האינטראקציה ב-Logs ב-Supabase
    await supabase.from('logs').insert({
      customer_phone: senderPhone,
      message: cleanMsg,
      reply: result.reply,
      is_order: result.orderPlaced
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Brain Error:", error);
    return res.status(200).json({ 
      reply: "בוס, המוח עמוס. וודא שכל המפתחות מוגדרים.", 
      success: false 
    });
  }
}
