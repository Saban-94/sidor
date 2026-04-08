import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    // 1. פתיחת הסתימה: וידוא שה-Body מעובד נכון גם אם נשלח כטקסט
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // 2. שליפת הנתונים כולל שדות הלוגיקה החדשים
    const { phone, items, address, unloading_method, status } = body;

    if (!phone || !items || items.length === 0) {
      return res.status(400).json({ error: "בוס, הסל ריק או חסר מספר טלפון" });
    }

    // 3. הכנת הנתונים לטבלה המקצועית של ח. סבן
    // אנחנו שומרים את ה-items כפי שהם (JSONB) כדי שתוכל לערוך אותם ידנית ב-Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([{ 
        customer_phone: String(phone), 
        items: items, // מערך של {name, qty}
        address: address || 'בתיאום טלפוני',
        unloading_method: unloading_method || 'לא נקבע',
        status: status || 'התקבל' // הסטטוס הראשוני לצומת הראשון בדף המעקב
      }])
      .select('id, order_number, status') // מחזירים את ה-ID והמספר הרץ
      .single();

    if (error) {
      console.error("Supabase Insert Error:", error.message);
      throw error;
    }

    // 4. החזרת הצלחה עם ה-order_number המהבהב
    return res.status(200).json({ 
      success: true, 
      orderId: data.id, 
      orderNumber: data.order_number,
      status: data.status 
    });

  } catch (err: any) {
    console.error("סתימה ב-API:", err.message);
    return res.status(400).json({ error: "בוס, הייתה תקלה בשמירה: " + err.message });
  }
}
