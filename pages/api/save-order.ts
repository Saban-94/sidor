import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY! // שימוש ב-Service Role לעקיפת חסימות
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    // פתיחת הסתימה: וידוא שה-Body מעובד נכון
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // שליפת הנתונים מהמבנה החדש של הסל
    const { phone, items, status } = body;

    if (!phone || !items || items.length === 0) {
      return res.status(400).json({ error: "הסל ריק או חסר מספר טלפון" });
    }

    // הכנה ל-Supabase - הופך את המערך לטקסט לקריאה נוחה
    const { data, error } = await supabase
      .from('orders')
      .insert([{ 
        customer_phone: phone, 
        items: JSON.stringify(items), 
        total_amount: items.length,
        status: status || 'pending',
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error("סתימה ב-API:", err.message);
    return res.status(400).json({ error: "שגיאת פורמט: " + err.message });
  }
}
