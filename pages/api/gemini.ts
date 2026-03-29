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

  // --- הגנות בסיס - חוקי ראמי ---
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח." });

  // --- בריכת המודלים ברוטציה ---
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash", "gemini-1.5-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפה ויצירת משתמש אוטומטית אם חסר
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    if (cleanMsg === "הוסף הזמנה") history = "";

    // תיקון לופים: עדכון היסטוריה מקומי לפני השאלה
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

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

    // 3. בניית ה-Prompt (קצר, חריף, אנטי-לופ)
    const prompt = `
      אתה העוזר של ראמי. דבר קצר (מילה-שתיים).
      סדר עץ חובה: 1. שם לקוח? -> 2. כתובת? -> 3. מחסן? -> 4. נהג?

      היסטוריה נוכחית:
      ${localUpdatedHistory}

      חוקים למניעת חזרה:
      - אם המשתמש נתן כתובת (כמו "זאב בלפר"), אסור לשאול "כתובת?" שוב. עבור מיד ל-"מחסן?".
      - תובנת לקוח חוזר: ${clientInsight}

      חוק הזרקה:
      אם הכל הושלם, החזר JSON בסוף התשובה:
      {"complete": true, "client": "שם", "address": "כתובת", "branch": "מחסן", "driver": "נהג"}
    `;

    // 4. הרצת רוטציית מודלים
    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text.trim();
          break; 
        }
      } catch (err) { continue; }
    }

    if (!replyText) throw new Error("Models failed");

    // 5. זיהוי סיום והזרקה לטבלה
    let finalReply = clientInsight || replyText;
    
    if (replyText.includes('"complete": true')) {
      const jsonMatch = replyText.match(/\{.*\}/s);
      if (jsonMatch) {
        const d = JSON.parse(jsonMatch[0]);
        await supabase.from('orders').insert([{
          client_info: d.client,
          location: d.address,
          source_branch: d.branch,
          driver_name: d.driver,
          delivery_date: new Date().toISOString().split('T')[0],
          order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        }]);
        finalReply = "הוזרק ללוח. 🚀";
        history = ""; 
      }
    } else {
      history = localUpdatedHistory + `\nAssistant: ${finalReply}`;
    }

    // 6. שמירת מצב בזיכרון
    await supabase.from('customer_memory').upsert({
      clientId: phone,
      accumulated_knowledge: history,
      last_update: new Date().toISOString()
    });

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, המוח עמוס. שוב?" });
  }
}
