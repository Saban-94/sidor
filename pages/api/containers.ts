import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// --- בלוק 1: חיבור למסד הנתונים ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, ההודעה ריקה." });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ חסר מפתח API." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-1.5-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'admin';

    // --- בלוק 2: שליפת זיכרון ונתוני שטח ---
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    let { data: activeContainers } = await supabase.from('container_management').select('*').eq('is_active', true);
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    // --- בלוק 3: תחקיר היסטוריה (תיקון לזיהוי "אורניל אבי") ---
    let lastActionInfo = "אין היסטוריה קודמת.";
    let foundClientName = "";
    
    // ניקוי מילות קישור כדי למצוא את השם נטו
    const searchTerms = cleanMsg.replace(/הלקוח|של|זה|הוא/g, '').trim().split(' ').filter(w => w.length > 2);
    
    if (searchTerms.length > 0) {
      const { data: lastOrder } = await supabase
        .from('container_management')
        .select('client_name, action_type, delivery_address, contractor_name')
        .or(searchTerms.map(t => `client_name.ilike.%${t}%`).join(','))
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();

      if (lastOrder) {
        foundClientName = lastOrder.client_name;
        lastActionInfo = `נמצא לקוח בהיסטוריה: ${lastOrder.client_name}. כתובת אחרונה: ${lastOrder.delivery_address}.`;
      }
    }

    const localUpdatedHistory = (memory?.accumulated_knowledge || "") + `\nUser: ${cleanMsg}`;

    // --- בלוק 4: הנחיות למפקח (הפרומפט) ---
    const prompt = `
      זהות: חכם של מכולות פינוי פסולת בשרון. סגנון: קצר, מנומס וחד.
      משימה: ניהול הצבה 🟢, החלפה ♻️, הוצאה 🔴 בשיטת "פינג-פונג".
      
      נתוני שטח: ${JSON.stringify(activeContainers)}
      היסטוריה שנמצאה: ${lastActionInfo}
      היסטוריית שיחה: ${localUpdatedHistory}

      חוקים קריטיים למניעת לופים:
      1. אם המשתמש ציין שם (כמו "אורניל אבי"), קבל אותו מיד! אל תשאל שוב "מי הלקוח".
      2. עבור ישר לשאלה הבאה בעץ: "מה הכתובת המדויקת למכולה?".
      3. איסור ערבוב: אם יש מכולה של קבלן בכתובת, רק הוא מבצע החלפה/הוצאה.
      4. בלי כוכביות (**). טקסט נקי. עיצוב UI/UX עם אימוג'ים.

      עץ שאלות: 1. לקוח 👤 -> 2. כתובת 📍 -> 3. פעולה ⚙️ -> 4. קבלן 🏗️ -> 5. זמן ⏰.
      
      DATA_START{"complete": true, "client": "שם", "address": "כתובת", "action": "PLACEMENT/EXCHANGE/REMOVAL", "contractor": "קבלן", "date": "YYYY-MM-DD", "time": "HH:mm", "size": "8 קוב"}DATA_END
    `;

    // --- בלוק 5: פנייה ל-AI ---
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

    // --- בלוק 6: הזרקה כפולה (Double Injection) לטבלה אחת ---
    if (replyText.includes('DATA_START')) {
      try {
        const jsonMatch = replyText.match(/\{.*\}/s);
        if (jsonMatch) {
          const d = JSON.parse(jsonMatch[0]);

          // א. בדיקת בעלות קבלן
          const currentOwner = activeContainers?.find(c => c.delivery_address.includes(d.address))?.contractor_name;
          if ((d.action === 'EXCHANGE' || d.action === 'REMOVAL') && currentOwner && currentOwner !== d.contractor) {
             return res.status(200).json({ reply: `❌ המכולה בכתובת זו שייכת ל${currentOwner}. ${d.contractor} לא מורשה לגעת בה.` });
          }

          // ב. הזרקה לניהול מכולות
          await supabase.from('container_management').insert([{
            client_name: d.client, delivery_address: d.address, action_type: d.action,
            contractor_name: d.contractor, container_size: d.size, start_date: d.date,
            order_time: d.time, status: 'approved', is_active: d.action !== 'REMOVAL'
          }]);

          // ג. הזרקה לטבלת ORDERS (הטבלה של הדשבורד)
          await supabase.from('orders').insert([{
            client_info: `מכולה: ${d.client} (${d.action === 'PLACEMENT' ? 'הצבה' : d.action === 'EXCHANGE' ? 'החלפה' : 'הוצאה'})`,
            location: d.address, order_time: d.time, delivery_date: d.date, 
            driver_name: d.contractor, status: 'approved', warehouse: 'מכולות'
          }]);

          isComplete = true;
        }
      } catch (e) { console.error("Error", e); }
    }

    // --- בלוק 7: עדכון זיכרון ---
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${replyText}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: isComplete ? "✅ בוס, המכולה הוזרקה ללוח המשימות! 🚀" : replyText });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." });
  }
}
