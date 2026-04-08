import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

// שימוש ב-Service Role Key מאפשר עקיפת חוקי RLS בשרת בבטחה
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // הגנה: בדיקה אם req.body כבר אובייקט או מחרוזת
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { driver_name, order_time, client_info, location, source_branch } = body;

    // וולידציה בסיסית
    if (!driver_name || !order_time) {
      return res.status(400).json({ error: 'חסר שם נהג או זמן הזמנה' });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([{ 
        driver_name, 
        order_time, 
        client_info, 
        location, 
        source_branch: source_branch || 'החרש',
        status: 'pending', // הוספת סטטוס התחלתי
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      message: `הזמנה ל${driver_name} נרשמה בהצלחה במערכת.` 
    });

  } catch (e: any) {
    console.error("Insert Error:", e);
    return res.status(400).json({ error: e.message || "שגיאה בעיבוד הנתונים" });
  }
}
