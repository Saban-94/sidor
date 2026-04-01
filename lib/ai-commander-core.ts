import { supabase } from './supabase';

export const processCommanderCommand = async (input: string, user: string) => {
  if (user !== 'ראמי מסארווה') return { msg: 'גישה חסומה למפקד בלבד.' };

  const text = input.trim();
  const lowerText = text.toLowerCase();

  // --- 1. זיהוי כוונת יצירה (הזרקה) ---
  if (lowerText.startsWith('תיצור') || lowerText.includes('הזמנה') || lowerText.includes('הובלה')) {
    
    // חילוץ נהג
    const driver = text.includes('חכמת') ? 'חכמת' : text.includes('עלי') ? 'עלי' : 'טרם שובץ';
    
    // חילוץ זמן (פורמט HH:MM)
    const timeMatch = text.match(/(\d{2}:\d{2})/);
    const orderTime = timeMatch ? timeMatch[0] : '08:00';
    
    // חילוץ מחסן
    const warehouse = text.includes('החרש') ? 'החרש' : text.includes('התלמיד') ? 'התלמיד' : 'ראשי';

    // חילוץ שם לקוח חכם - מנקה מילות פקודה
    let clientName = text
      .replace(/תיצור|הזמנה|הובלה|לחכמת|לעלי|לשעה|ממחסן|החרש|התלמיד|למחר|ב-/g, '')
      .replace(/ללקוח|ל-/g, '')
      .trim();
    
    if (!clientName || clientName.length < 2) clientName = "לקוח כללי";

    // הזרקה ל-DB (שמות שדות מדויקים מה-SQL שלך)
    const { data, error } = await supabase.from('orders').insert([{
      client_info: clientName,
      order_time: orderTime,
      driver_name: driver,
      warehouse: warehouse,
      status: 'approved',
      delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    }]).select();

    if (error) return { msg: `שגיאה ב-DB: ${error.message}` };
    
    return { 
      msg: `בוצע! הזמנה ל-${clientName} הופקה לנהג ${driver} בשעה ${orderTime} מסניף ${warehouse}.`,
      data: data?.[0]
    };
  }

  // --- 2. לוגיקת מחיקה ---
  if (lowerText.includes('מחק') || lowerText.includes('בטל')) {
    const id = text.match(/[0-9a-fA-F-]{36}/)?.[0] || text.match(/\d+/)?.[0];
    if (!id) return { msg: 'בוס, תן לי מספר הזמנה למחיקה.' };
    const { error } = await supabase.from('orders').delete().eq('id', id);
    return error ? { msg: 'המחיקה נכשלה' } : { msg: `הזמנה ${id} נמחקה.` };
  }

  return { msg: "לא זיהיתי פקודה. נסה: 'תיצור הזמנה לחכמת ללקוח אבי לוי ב-11:00'" };
};
