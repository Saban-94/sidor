import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // הגנה: פירוק הנתונים עם ערכי ברירת מחדל כדי למנוע שגיאת 400
    const { 
      phone, 
      items = [], 
      address = 'בתיאום טלפוני', 
      unloading_method = 'לא נקבע', 
      status = 'התקבל' 
    } = body;

    // בדיקה מינימלית בלבד - רק טלפון חייב להיות
    if (!phone) {
      return res.status(400).json({ error: "חסר מספר טלפון לזיהוי ההזמנה" });
    }

    // הכנה לטבלה - שים לב לשמות השדות (customer_phone)
    const orderData = { 
      customer_phone: String(phone), 
      items: Array.isArray(items) ? items : [], 
      address: address,
      unloading_method: unloading_method,
      status: status
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select('id, order_number, status')
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      // אם השגיאה היא שדה חסר בטבלה, זה יודפס כאן ב-Logs של Vercel
      return res.status(400).json({ error: "שגיאה בבסיס הנתונים: " + error.message });
    }

    return res.status(200).json({ 
      success: true, 
      orderId: data.id, 
      orderNumber: data.order_number,
      status: data.status 
    });

  } catch (err: any) {
    console.error("Critical API Error:", err.message);
    return res.status(400).json({ error: "סתימה בפורמט: " + err.message });
  }
}
