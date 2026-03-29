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

  // הגנות בסיס - חוקי ראמי
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash", "gemini-1.5-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. חקירה וצבירת זיכרון - אם אין משתמש, יוצרים חדש
    let { data: memory, error: fetchError } = await supabase
      .from('customer_memory')
      .select('accumulated_knowledge')
      .eq('clientId', phone)
      .maybeSingle();

    // לוגיקת יצירת משתמש חדש בשידור חי
    if (!memory) {
      const { data: newUser, error: createError } = await supabase
        .from('customer_memory')
        .insert([{ clientId: phone, name: 'ראמי', accumulated_knowledge: '' }])
        .select()
        .single();
      
      if (createError) throw createError;
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    if (cleanMsg === "הוסף הזמנה") history = "";

    // 2. בדיקת לקוח חוזר (היסטוריית הזמנות)
    let clientInsight = "";
    if (history.includes("שם לקוח?") && !history.includes("כתובת?")) {
      const { data: pastOrder } = await supabase
        .from('orders')
        .select('location, client_info')
        .ilike('client_info', `%${cleanMsg}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (pastOrder) {
        clientInsight = `בוס, ${pastOrder.client_info} מוכר. פעם אחרונה: ${pastOrder.location}. לשם או כתובת חדשה?`;
      }
    }

    // 3. בניית ה-Prompt הקצר
    const prompt = `
      אתה העוזר של ראמי. קצר (מילה-שתיים).
      עץ: 1. שם לקוח? 2. כתובת? 3. מחסן? 4. נהג?
      
      היסטוריה: ${history}
      הודעה: "${cleanMsg}"
      תובנה: ${clientInsight}

      חוק סיום: אם הכל הושלם, החזר JSON בסוף:
      {"complete": true, "client": "שם", "address": "כתובת", "branch": "מחסן", "driver": "נהג"}
    `;

    // 4. רוטציית מודלים
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

    // 5. הזרקה ללוח ואיפוס
    let finalReply = clientInsight || replyText;
    if (replyText.includes('"complete": true')) {
      const d = JSON.parse(replyText.match(/\{.*\}/s)![0]);
      await supabase.from('orders').insert([{
        client_info: d.client,
        location: d.address,
        source_branch: d.branch,
        driver_name: d.driver,
        order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      }]);
      finalReply = "הוזרק ללוח. 🚀";
      history = "";
    } else {
      history += `\nUser: ${cleanMsg}\nAssistant: ${finalReply}`;
    }

    // 6. עדכון זיכרון סופי
    await supabase.from('customer_memory').upsert({
      clientId: phone,
      accumulated_knowledge: history
    });

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, תקלה ברישום. נסה שוב." });
  }
}
