import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // מפתח אחד בלבד
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API." });

  // רשימת המודלים להתאמה
  const modelPool = [
    "gemini-3.1-flash-lite-preview", // המעודכן ביותר ל-3.1 lite
    "gemini-2.0-flash", 
    "gemini-1.5-flash"
  ];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // 1. שליפת נתוני שטח (מכולות פעילות)
    const { data: activeContainers } = await supabase
      .from('container_management')
      .select('*')
      .eq('is_active', true);

    // 2. ניהול זיכרון
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    if (cleanMsg === "הזמנה חדשה" || cleanMsg === "מכולה") history = "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

    // 3. ה-Prompt המפקח
    const prompt = `
      זהות: מפקח מכולות חכם. סגנון: קצר וחד.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴.
      
      שטח נוכחי: ${JSON.stringify(activeContainers)}

      חוקים:
      1. הצבה בכתובת קיימת? התרע והצע החלפה.
      2. מעל 9 ימים? דרוש הוצאה/החלפה.
      3. מחסנים: שארק 30, כראדי 32, שי שרון 40.
      
      סדר: לקוח -> כתובת -> פעולה -> מחסן -> תאריך ושעה.

      סיום: ענה "בוצע 🚀" + JSON:
      DATA_START{"complete": true, "client": "שם", "address": "כתובת", "action": "PLACEMENT/EXCHANGE/REMOVAL", "contractor": "מחסן", "date": "YYYY-MM-DD", "time": "HH:mm"}DATA_END
    `;

    // 4. רוטציית מודלים על מפתח יחיד
    let replyText = "";
    let success = false;

    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 } 
          })
        });
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text.trim();
          success = true;
          break;
        }
      } catch (e) { continue; }
    }

    if (!success) throw new Error("Models failed");

    let isComplete = false;

    // 5. הזרקה לטבלה
    if (replyText.includes('DATA_START')) {
      const jsonMatch = replyText.match(/\{.*\}/s);
      if (jsonMatch) {
        const d = JSON.parse(jsonMatch[0]);
        
        if (d.action === 'REMOVAL' || d.action === 'EXCHANGE') {
          await supabase.from('container_management').update({ is_active: false }).eq('delivery_address', d.address).eq('is_active', true);
        }

        const { error: insertError } = await supabase.from('container_management').insert([{
          client_name: d.client,
          delivery_address: d.address,
          action_type: d.action,
          contractor_name: d.contractor,
          start_date: d.date || new Date().toISOString().split('T')[0],
          order_time: d.time || "08:00",
          is_active: d.action !== 'REMOVAL'
        }]);
        if (!insertError) isComplete = true;
      }
    }

    // 6. עדכון זיכרון
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: replyText });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המערכת בעומס. נסה שוב." });
  }
}
