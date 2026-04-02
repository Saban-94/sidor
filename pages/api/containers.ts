import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח API." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-1.5-flash"];

 try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // 1. שליפת זיכרון ומכולות פעילות
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    let { data: activeContainers } = await supabase.from('container_management').select('*').eq('is_active', true);
    
    // 2. תחקיר היסטוריה משופר - מחפש כל מילה בשם הלקוח בנפרד
    let lastActionInfo = "אין היסטוריה קודמת.";
    const potentialNames = cleanMsg.replace(/[?!,.]/g, '').split(' ').filter(w => w.length > 2);
    
    if (potentialNames.length > 0) {
      // מחפש התאמה לאחד השמות שצוינו (כמו 'אורני' או 'לוי')
      const { data: lastOrder } = await supabase
        .from('container_management')
        .select('client_name, action_type, start_date, delivery_address')
        .or(potentialNames.map(name => `client_name.ilike.%${name}%`).join(','))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastOrder) {
        lastActionInfo = `🚨 תזכורת מפקח: נמצא לקוח דומה - ${lastOrder.client_name}. פעולה אחרונה: ${lastOrder.action_type} בכתובת ${lastOrder.delivery_address} בתאריך ${lastOrder.start_date}.`;
      }
    }

    const localUpdatedHistory = (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}`;

    // 3. פרומפט עם חוק "עצור ותשאל"
    const prompt = `
      זהות: מפקח מכולות חכם של סבן. 
      משימה: ניהול מכולות בשיטת "פינג-פונג" (שאלה אחת בכל פעם).
      
      מידע שטח נוכחי: ${JSON.stringify(activeContainers)}
      מידע היסטורי שמצאתי: ${lastActionInfo}
      היסטוריית שיחה: ${localUpdatedHistory}

      חוקי ברזל:
      1. אם מצאת היסטוריה (כמו אבי לוי), חובה לשאול: "בוס, מצאתי את ${searchedClient}, לבצע עבורו את הפעולה בכתובת ${lastActionInfo.address}?"
      2. אל תמציא כתובת! אם המשתמש לא אמר כתובת בפירוש בהודעה האחרונה, שאל: "מה הכתובת המדויקת?"
      3. אל תבצע הזרקה (DATA_START) אם חסר אפילו פרט אחד מהעץ: לקוח, כתובת, פעולה, קבלן, זמן.
      4. גודל: תמיד 8 קוב.

      עץ שאלות: 1. לקוח -> 2. כתובת -> 3. פעולה -> 4. קבלן -> 5. זמן.
    `;

    // 4. הרצה מול Gemini
    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        replyText = data.candidates[0].content.parts[0].text.trim();
        if (replyText) break;
      } catch (e) { continue; }
    }

    let isComplete = false;

    // 5. הזרקה כפולה חזקה (ניהול + דשבורד LIVE)
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);
          
          if (d.action === 'REMOVAL' || d.action === 'EXCHANGE') {
            await supabase.from('container_management').update({ is_active: false }).eq('delivery_address', d.address).eq('is_active', true);
          }

          const { error: containerErr } = await supabase.from('container_management').insert([{
            client_name: d.client,
            delivery_address: d.address,
            action_type: d.action,
            contractor_name: d.contractor,
            container_size: d.size,
            start_date: d.date,
            order_time: d.time,
            status: 'approved',
            is_active: d.action !== 'REMOVAL'
          }]);

          const { error: orderErr } = await supabase.from('orders').insert([{
            client_info: `מכולה: ${d.client} (${d.action === 'PLACEMENT' ? 'הצבה' : d.action === 'EXCHANGE' ? 'החלפה' : 'הוצאה'})`,
            location: d.address,
            order_time: d.time,
            delivery_date: d.date,
            driver_name: d.contractor,
            status: 'approved',
            warehouse: 'מכולות'
          }]);

          if (!containerErr && !orderErr) isComplete = true;
        }
      } catch (e) { console.error("Injection Error", e); }
    }

    // 6. עדכון זיכרון
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    const finalReply = isComplete ? `בוס, המשימה נקלטה! הזרקתי לניהול ולדשבורד. 🚀` : replyText;

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." });
  }
}
