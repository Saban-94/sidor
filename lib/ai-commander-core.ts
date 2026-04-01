import { supabase } from './supabase';

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
