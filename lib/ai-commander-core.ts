import { supabase } from './supabase';

export const processCommanderCommand = async (input: string, user: string) => {
  if (user !== 'ראמי מסארווה') return { msg: 'גישה חסומה.' };

  const text = input.trim();
  const lowerText = text.toLowerCase();

  // 1. זיהוי סוג הפעולה (לוגיקת ה-API)
  let type: 'ORDER' | 'CONTAINER' | 'TRANSFER' = 'ORDER';
  if (lowerText.includes('מכולה') || lowerText.includes('הצבה') || lowerText.includes('החלפה')) type = 'CONTAINER';
  if (lowerText.includes('העברה') || lowerText.includes('מהתלמיד') || lowerText.includes('מהחרש')) type = 'TRANSFER';

  // 2. חילוץ נתונים (שימוש ב-Regex משופר)
  const orderId = text.match(/\d{5,}/)?.[0] || null;
  const timeMatch = text.match(/(\d{2}:\d{2})/);
  const orderTime = timeMatch ? timeMatch[0] : '08:00';
  const date = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // למחר

  // זיהוי מבצע (נהג או קבלן)
  const executor = text.includes('חכמת') ? 'חכמת' : 
                   text.includes('עלי') ? 'עלי' : 
                   text.includes('שארק') ? 'שארק 30' : 
                   text.includes('שי שרון') ? 'שי שרון 40' : 'טרם שובץ';

  // חילוץ שם לקוח/כתובת
  let clientName = text.replace(/תיצור|הזמנה|הובלה|מכולה|לשעה|ב-|מחר/g, '').trim();

  // 3. ביצוע הזרקה לפי סוג (העתקת לוגיקת ה-API)
  try {
    if (type === 'CONTAINER') {
      const actionType = lowerText.includes('החלפה') ? 'החלפה' : lowerText.includes('הוצאה') ? 'הוצאה' : 'הצבה';
      
      await Promise.all([
        supabase.from('container_management').insert([{
          client_name: clientName,
          action_type: actionType,
          contractor_name: executor,
          order_time: orderTime,
          start_date: date,
          status: 'approved',
          is_active: true,
          order_number: orderId
        }]),
        supabase.from('orders').insert([{
          client_info: `מכולה: ${clientName} (${actionType})`,
          order_time: orderTime,
          driver_name: executor,
          status: 'approved',
          delivery_date: date
        }])
      ]);
    } else if (type === 'TRANSFER') {
      await supabase.from('transfers').insert([{
        from_branch: text.includes('מהחרש') ? 'החרש' : 'התלמיד',
        to_branch: text.includes('לחרש') ? 'החרש' : 'התלמיד',
        driver_name: executor,
        transfer_date: date,
        order_time: orderTime
      }]);
    } else {
      await supabase.from('orders').insert([{
        client_info: clientName,
        order_time: orderTime,
        driver_name: executor,
        status: 'approved',
        delivery_date: date,
        order_number: orderId
      }]);
    }

    return { msg: `בוס, הפעולה (${type}) הוזרקה ללוח של ${executor}. 🚀` };
  } catch (err) {
    return { msg: 'שגיאה בהזרקה ל-Database' };
  }
};
