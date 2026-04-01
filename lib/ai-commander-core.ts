import { supabase } from './supabase';
import { supabase } from './supabase';

export const processCommanderCommand = async (input: string, user: string) => {
  if (user !== 'ראמי מסארווה') return { error: 'Unauthorized' };

  const text = input.toLowerCase();
  
  // 1. זיהוי כוונת יצירה
  if (text.includes('תיצור') || text.includes('הזמנה') || text.includes('הובלה')) {
    
    // חילוץ נהג (חכמת/עלי/שארק)
    const driver = text.includes('חכמת') ? 'חכמת' : text.includes('עלי') ? 'עלי' : 'טרם שובץ';
    
    // חילוץ לקוח (מחפש מילים אחרי "ללקוח" או "ל-")
    const clientMatch = input.match(/(?:ללקוח|ל-)\s*([א-ת\s]+?)(?=\s+(?:לשעה|מחר|ממחסן|ב-|$))/);
    const clientName = clientMatch ? clientMatch[1].trim() : 'לקוח כללי';
    
    // חילוץ שעה (HH:MM)
    const timeMatch = input.match(/(\d{2}:\d{2})/);
    const orderTime = timeMatch ? timeMatch[0] : '08:00';
    
    // חילוץ מחסן
    const warehouse = text.includes('החרש') ? 'החרש 10' : text.includes('התלמיד') ? 'התלמיד 6' : 'ראשי';

    // הזרקה ל-DB לפי המבנה המדויק שלך (client_info, order_time וכו')
    const { data, error } = await supabase.from('orders').insert([{
      client_info: clientName,
      order_time: orderTime,
      driver_name: driver,
      warehouse: warehouse,
      status: 'approved', // אישור מפקד אוטומטי
      delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0] // למחר
    }]).select();

    if (error) return { msg: `שגיאה בהזרקה: ${error.message}` };
    
    return { 
      msg: `בוס, הפקודה בוצעה: הזמנה ל-${clientName} הופקה לנהג ${driver} בשעה ${orderTime} ממחסן ${warehouse}.`,
      data 
    };
  }

  // 2. פקודות עדכון/מחיקה (כפי שהגדרנו קודם)
  // ... (שאר הלוגיקה)
  return { msg: "לא זיהיתי פקודה ברורה. נסה: 'תיצור הובלה לחכמת ללקוח אבי לוי...'" };
};


export const processCommanderCommand = async (input: string, user: string) => {
  if (user !== 'ראמי מסארווה') return { error: 'Unauthorized' };

  const text = input.toLowerCase();
  
  // לוגיקה למחיקה
  if (text.includes('מחק') || text.includes('בטל')) {
    const id = text.match(/\d+/)?.[0];
    const { error } = await supabase.from('orders').delete().eq('id', id);
    return error ? { msg: 'נכשל' } : { msg: `הזמנה ${id} נמחקה.` };
  }

  // לוגיקה לעדכון סטטוס / מספר הזמנה
  if (text.includes('עדכן') || text.includes('שנה')) {
    const orderId = text.match(/\d+/)?.[0];
    let updateData: any = {};
    if (text.includes('סטטוס')) updateData.status = text.split('ל').pop()?.trim();
    if (text.includes('מספר')) updateData.order_number = text.match(/\d{5,}/)?.[0];

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
    return error ? { msg: 'נכשל' } : { msg: 'עודכן.' };
  }

  // לוגיקה ליצירה חופשית
  if (text.includes('תיצור') || text.includes('הזמנה')) {
    // חילוץ נתונים מהיר (Regex)
    const name = input.match(/ל([א-ת\s]+)למחר/)?.[1] || 'כללי';
    const time = input.match(/(\d{2}:\d{2})/)?.[0] || '08:00';
    
    const { data, error } = await supabase.from('orders').insert([{
      customer_name: name.trim(),
      delivery_time: time,
      status: 'חדש',
      created_by: 'ראמי'
    }]).select();

    return error ? { msg: 'שגיאה' } : { msg: 'הוזרק.', data };
  }
};
