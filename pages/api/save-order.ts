import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    // 1. חילוץ נתונים בטוח - תמיכה גם ב-phone וגם ב-customer_phone
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    const phone = body.phone || body.customer_phone;
    const items = body.items || [];
    const address = body.address || 'בתיאום';
    const unloading = body.unloading_method || body.unloading || 'לא נקבע';

    // 2. בדיקה שהנתונים הבסיסיים קיימים
    if (!phone) {
      return res.status(400).json({ success: false, error: "Missing phone number" });
    }

    // 3. הכנת האובייקט בדיוק לפי שמות העמודות בטבלה
    // וודא שב-Supabase העמודה היא customer_phone
    const payload = { 
      customer_phone: String(phone), 
      items: Array.isArray(items) ? items : [], 
      address: address,
      unloading_method: unloading,
      status: 'התקבל'
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([payload])
      .select('id, order_number, status')
      .single();

    if (error) {
      console.error("Supabase Error:", error.message);
      // החזרת השגיאה המדויקת מה-DB כדי שנדע מה חסר
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      orderId: data.id, 
      orderNumber: data.order_number 
    });

  } catch (err: any) {
    console.error("Critical API Error:", err.message);
    return res.status(400).json({ success: false, error: "Format error: " + err.message });
  }
}
