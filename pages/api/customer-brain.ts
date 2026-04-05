import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// מודלים מעודכנים לאפריל 2026 עם רוטציה (ללא שגיאות API)
const modelPool = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-pro-preview",
  "gemini-2.0-flash"
];

const MUNICIPALITY_RULES: any = {
  "תל אביב": { alert: "חובה לפנות בשישי עד 10:00. קנס: ~730 ש\"ח." },
  "הרצליה": { alert: "חובה לפנות בשישי עד 14:00. אין השארה בשבת! קנס: 800 ש\"ח." },
  "נתניה": { alert: "אגרת הצבה יומית: 140 ש\"ח. הצבה בכחול-לבן בלבד." },
  "רעננה": { alert: "פינוי חובה משישי 12:00. קנס: 730 ש\"ח." },
  "חולון": { alert: "נוהל 2026: איסור מוחלט על השארה בסופ\"ש." }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  const phone = senderPhone?.replace('@c.us', '') || 'unknown';
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. שליפת ידע משולב: אימון, מלאי, זיכרון והזמנה אחרונה
    const { data: training } = await supabase.from('ai_training').select('content');
    const { data: inventory } = await supabase.from('brain_inventory').select('*');
    let { data: memory } = await supabase.from('customer_memory').select('*').eq('clientId', phone).maybeSingle();
    let { data: lastOrder } = await supabase.from('orders').select('*').ilike('client_info', `%${phone}%`).order('created_at', { ascending: false }).limit(1).maybeSingle();
    
    let currentUserName = memory?.user_name || "";
    let chatHistory = memory?.accumulated_knowledge || "";
    
    // 2. זיהוי לוגיקה עירונית (מכולות)
    let cityLogic = "";
    for (const city in MUNICIPALITY_RULES) {
      if (cleanMsg.includes(city)) cityLogic = `עיר: ${city}. הנחיה: ${MUNICIPALITY_RULES[city].alert}`;
    }

    const orderStatusInfo = lastOrder ? 
      `הזמנה #${lastOrder.order_number}: ${lastOrder.status}. שעה: ${lastOrder.delivery_time || 'בטיפול'}. נהג: ${lastOrder.driver_info || 'טרם שויך'}.` 
      : "אין הזמנה פעילה.";

    // 3. בניית ה-PROMPT המורחב (הכרה ל-GEM)
    const prompt = `
      זהות: אתה המוח של "ח.סבן חומרי בניין". סמכותי ומקצועי.
      לקוח: ${currentUserName || 'חדש'}. טלפון: ${phone}.
      סטטוס הזמנה: ${orderStatusInfo}
      
      ידע מקצועי (אימון): ${training?.map(t => t.content).join('\n')}
      מלאי זמין: ${inventory?.map(i => `${i.product_name} (${i.sku}): ${i.price}₪`).join('\n')}
      ${cityLogic}

      משימות Gem:
      - פינג-פונג: בקש פרט אחד בכל פעם (שם משפחה, כתובת).
      - הזמנה: אשר בבולטים (•) והוסף SAVE_ORDER_DB:[SKU]:[QTY].
      - הערה/דחיפות: הוסף CLIENT_NOTE:[הטקסט]. (מפעיל זיקית 🦎).
      - בייעוץ טכני: אל תדבר על הובלה/אספקה.

      הודעה נוכחית: "${cleanMsg}"
      זיכרון: ${chatHistory.slice(-800)}
    `;

    // 4. הרצה עם רוטציית מודלים (Fallback)
    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (replyText) break;
      } catch (e) { continue; }
    }

    // 5. זיהוי שם משפחה ידני (לוגיקה מהמאגר השני)
    if (cleanMsg.length < 15 && !cleanMsg.includes(" ") && !currentUserName.includes(cleanMsg) && !cleanMsg.includes("?")) {
        currentUserName = currentUserName ? `${currentUserName} ${cleanMsg}` : cleanMsg;
    }

    // 6. עדכון DB וניהול הזיקית 🦎
    const hasOrderAction = replyText.includes("SAVE_ORDER_DB:") || replyText.includes("CLIENT_NOTE:") || (lastOrder && lastOrder.status === 'pending');
    
    if (hasOrderAction) {
      const clientNote = replyText.match(/CLIENT_NOTE:\[(.*?)\]/)?.[1] || null;
      
      if (lastOrder && lastOrder.status === 'pending') {
        await supabase.from('orders').update({
          client_info: `שם: ${currentUserName} | טלפון: ${phone}`,
          warehouse: lastOrder.warehouse + (replyText.includes("•") ? `\n• עדכון: ${cleanMsg}` : ""),
          customer_note: clientNote || lastOrder.customer_note,
          has_new_note: !!clientNote
        }).eq('id', lastOrder.id);
      } else {
        await supabase.from('orders').insert([{
          client_info: `שם: ${currentUserName} | טלפון: ${phone}`,
          product_name: "📦 סל מוצרים",
          warehouse: cleanMsg,
          customer_note: clientNote,
          has_new_note: !!clientNote,
          status: 'pending',
          order_time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    }

    // 7. עדכון זיכרון לקוח
    await supabase.from('customer_memory').upsert({
      clientId: phone, 
      user_name: currentUserName, 
      accumulated_knowledge: (chatHistory + "\nU: " + cleanMsg + "\nAI: " + replyText).slice(-1200)
    }, { onConflict: 'clientId' });

    // 8. ניקוי פקודות (מניעת נזילת קוד ללקוח)
    const finalReply = replyText
      .replace(/SAVE_ORDER_DB:\[?.*?\]?/g, "")
      .replace(/CLIENT_NOTE:\[?.*?\]?/g, "")
      .replace(/\[.*?\]/g, "")
      .trim() || "תודה, הפרטים עודכנו. נציג יחזור אליך במידת הצורך.";

    return res.status(200).json({ reply: finalReply });

  } catch (error) {
    console.error("Brain Failure:", error);
    return res.status(200).json({ reply: "קיבלתי, מטפל בזה עכשיו." });
  }
}
