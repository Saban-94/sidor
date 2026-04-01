import { supabase } from './supabase';

export const processCommanderCommand = async (input: string, user: string) => {
  // בדיקת הרשאת מפקד
  if (user !== 'ראמי מסארווה') return { msg: 'גישה חסומה. פנה לראמי.' };

  const text = input.toLowerCase();

  // --- 1. לוגיקת מחיקה / ביטול ---
  if (text.includes('מחק') || text.includes('בטל')) {
    const id = input.match(/[0-9a-fA-F-]{36}/)?.[0] || input.match(/\d+/)?.[0];
    if (!id) return { msg: 'בוס, תן לי מספר הזמנה למחיקה.' };

    const { error } = await supabase.from('orders').delete().eq('id', id);
    return error ? { msg: `נכשל: ${error.message}` } : { msg: `הזמנה ${id} הוסרה מהלוח.` };
  }

  // --- 2. לוגיקת עדכון (סטטוס / מספר הזמנה) ---
  if (text.includes('עדכן') || text.includes('שנה')) {
    const orderId = input.match(/[0-9a-fA-F-]{36}/)?.[0] || input.match(/\d+/)?.[0];
    if (!orderId) return { msg: 'בוס, איזו הזמנה לעדכן?' };

    let updateData: any = {};
    
    if (text.includes('סטטוס')) {
      updateData.status = input.split('ל').pop()?.trim();
    }
    if (text.includes('מספר')) {
      updateData.order_number = input.match(/\d{4,}/)?.[0];
    }
    if (text.includes('נהג')) {
      updateData.driver_name = text.includes('חכמת') ? 'חכמת' : text.includes('עלי') ? 'עלי' : 'טרם שובץ';
    }

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
    return error ? { msg: `עדכון נכשל: ${error.message}` } : { msg: 'עודכן בלוח בזמן אמת.' };
  }

  // --- 3. לוגיקת הזרקה חופשית (יצירה) ---
  if (text.includes('תיצור') || text.includes('הזמנה') || text.includes('הובלה')) {
    
    // חילוץ נהג
    const driver = text.includes('חכמת') ? 'חכמת' : text.includes('עלי') ? 'עלי' : 'טרם שובץ';
    
    // חילוץ לקוח - Regex חכם שמחפש אחרי "ללקוח" או "ל-"
    const clientMatch = input.match(/(?:ללקוח|ל-)\s*([א-ת\s]+?)(?=\s+(?:לשעה|מחר|ממחסן|ב-|$))/);
    const clientName = clientMatch ? clientMatch[1].trim() : (input.split('ל')[1]?.split(' ')[1] || 'לקוח כללי');
    
    // חילוץ שעה
    const timeMatch = input.match(/(\d{2}:\d{2})/);
    const orderTime = timeMatch ? timeMatch[0] : '08:00';
    
    // חילוץ מחסן/סניף
    const warehouse = text.includes('החרש') ? 'החרש 10' : text.includes('התלמיד') ? 'התלמיד 6' : 'ראשי';

    // הזרקה לפי שמות העמודות ב-DB שלך
    const { data, error } = await supabase.from('orders').insert([{
      client_info: clientName,
      order_time: orderTime,
      driver_name: driver,
      warehouse: warehouse,
      status: 'approved',
      delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0] // ברירת מחדל: למחר
    }]).select();

    if (error) return { msg: `הזרקה נכשלה: ${error.message}` };
    
    return { 
      msg: `בוס, בוצע! הזמנה ל-${clientName} הופקה לנהג ${driver} בשעה ${orderTime} ממחסן ${warehouse}.`,
      data 
    };
  }

  return { msg: "בוס, לא זיהיתי פקודה. נסה: 'תיצור הובלה לחכמת ללקוח אבי לוי ב-11:00'" };
};
