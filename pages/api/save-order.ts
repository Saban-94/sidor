import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { driver_name, order_time, client_info, location, source_branch } = req.body;

  if (!driver_name || !order_time) {
    return res.status(400).json({ error: 'Missing driver name or time' });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{ 
        driver_name, 
        order_time, 
        client_info, 
        location, 
        source_branch: source_branch || 'החרש' 
      }]);

    if (error) throw error;

    return res.status(200).json({ success: true, message: `הזמנה לעלי/חכמת נרשמה בהצלחה.` });
  } catch (e: any) {
    console.error("Insert Error:", e);
    return res.status(500).json({ error: e.message });
  }
}
