import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();
  // --- הגנות בסיס ---
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח (GEMINI_API_KEY חסר)." });

  // Model Pool מעודכן לשמות המודלים של Google
  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash"];
  try {
    const prompt = `
      זהות: עוזר אישי לראמי (ח. סבן). סגנון: מקצועי וחד.
      תפקיד: זיהוי ענף (חומרים/מכולות/העברות) וסוג פעולה.
      
      חוקי מכולות (CONTAINER):
      - "הצבה" / "חדשה" -> action_type: "הצבה"
      - "החלפה" / "ריקון" -> action_type: "החלפה"
      - "הוצאה" / "פינוי" -> action_type: "הוצאה"

      חוקי העברה (TRANSFER):
      - זיהוי מאיזה סניף לאיזה סניף (החרש/התלמיד).

      הזרק JSON מדויק:
      DATA_START{
        "type": "ORDER" | "CONTAINER" | "TRANSFER",
        "action_type": "הצבה" | "החלפה" | "הוצאה",
        "client": "שם", "address": "כתובת", "date": "YYYY-MM-DD", "time": "HH:mm", "executor": "נהג/קבלן",
        "from_branch": "סניף מקור", "to_branch": "סניף יעד"
      }DATA_END
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt + "\nMessage: " + cleanMsg }] }] })
    });
    const data = await response.json();
    const replyText = data.candidates[0].content.parts[0].text;

    if (replyText.includes('DATA_START')) {
      const d = JSON.parse(replyText.match(/\{.*\}/s)[0]);
      let finalNum = "";

      if (d.type === "CONTAINER") {
        const { data: ins } = await supabase.from('container_management').insert([{
          client_name: d.client, delivery_address: d.address, start_date: d.date, 
          order_time: d.time, contractor_name: d.executor, action_type: d.action_type, is_active: true
        }]).select('order_number').single();
        finalNum = ins?.order_number;
      } else if (d.type === "TRANSFER") {
        const { data: ins } = await supabase.from('transfers').insert([{
          from_branch: d.from_branch, to_branch: d.to_branch, transfer_date: d.date,
          transfer_time: d.time, driver_name: d.executor, status: 'approved'
        }]).select('order_number').single();
        finalNum = ins?.order_number;
      } else {
        const { data: ins } = await supabase.from('orders').insert([{
          client_info: d.client, location: d.address, delivery_date: d.date, 
          order_time: d.time, driver_name: d.executor, status: 'approved'
        }]).select('order_number').single();
        finalNum = ins?.order_number;
      }
      return res.status(200).json({ reply: `בוס, הזמנה #${finalNum} ל-${d.client || d.to_branch} הוזרקה ללוח. 🚀` });
    }
    return res.status(200).json({ reply: replyText });
  } catch (e) { return res.status(200).json({ reply: "בוס, המוח התעייף. נסה שוב." }); }
}
