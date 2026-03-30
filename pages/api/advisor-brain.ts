import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone, message, chatHistory } = req.body;

  try {
    // 1. שליפת קונטקסט: מי הלקוח ומה הפרויקטים שלו
    const { data: customer } = await supabase
      .from('customers')
      .select('*, customer_projects(*)')
      .eq('phone', phone)
      .single();

    // 2. שליפת מחירון מוצרים עדכני ל"זיכרון" של המוח
    const { data: products } = await supabase
      .from('products_catalog')
      .select('*')
      .eq('is_active', true);

    const productContext = products?.map(p => 
      `${p.product_name} (${p.unit}): ${p.price_retail}₪. הערות: ${p.technical_notes}`
    ).join('\n');

    // 3. הגדרת הכלים (Functions) שה-AI יכול להפעיל
    const tools: any[] = [{
      type: 'function',
      function: {
        name: 'create_order_for_rami',
        description: 'הזרקת הזמנה סופית ללוח של ראמי לאחר אישור לקוח',
        parameters: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'ID של הפרויקט הנבחר' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_name: { type: 'string' },
                  qty: { type: 'number' },
                  unit: { type: 'string' }
                }
              }
            },
            delivery_type: { type: 'string', enum: ['crane', 'manual'], description: 'מנוף או פריקה ידנית' },
            notes: { type: 'string', description: 'הערות מיוחדות' }
          },
          required: ['project_id', 'items', 'delivery_type']
        }
      }
    }];

    // 4. בניית הפרומפט האישי
    const systemPrompt = `
      אתה "Saban Advisor" - מנהל תיקי לקוחות ויועץ טכני בחברת ח. סבן.
      הלקוח הנוכחי: ${customer?.name || 'לא ידוע'}.
      פרויקטים זמינים: ${customer?.customer_projects?.map((p: any) => p.project_name + " ב-" + p.address).join(', ')}.
      
      מחירון ומידע טכני:
      ${productContext}

      תפקידך:
      1. לנהל שיחה מכירתית ומקצועית. 
      2. אם הלקוח מבקש מוצר, השתמש במידע הטכני כדי לייעץ (למשל: המלץ על סומסום לריצוף חוץ).
      3. בנה סל קניות תוך כדי שיחה.
      4. וודא תמיד: לאיזה פרויקט האספקה? האם צריך מנוף?
      5. רק כשהלקוח אומר "אשר הזמנה" או "תזמין לי", הפעל את הפונקציה create_order_for_rami.
      
      חשוב: אל תבטיח שעה מדויקת. אמור שראמי יחזור אליו עם אישור סופי.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // או gpt-4-turbo
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: message }
      ],
      tools: tools,
      tool_choice: 'auto'
    });

    const aiMessage = response.choices[0].message;

    // 5. טיפול בהזרקת הזמנה אם ה-AI החליט להפעיל פונקציה
    if (aiMessage.tool_calls) {
      const toolCall = aiMessage.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      const { error: orderError } = await supabase
        .from('orders_pending')
        .insert([{
          customer_id: customer.id,
          project_id: args.project_id,
          items: args.items,
          delivery_type: args.delivery_type,
          special_notes: args.notes,
          status: 'pending_rami'
        }]);

      if (!orderError) {
        return res.status(200).json({ 
          reply: `בוס, ההזמנה הוזרקה למערכת! ראמי קיבל את כל הפרטים ללוח המשימות שלו ויחזור אליך בקרוב לאישור סופי.`,
          orderConfirmed: true 
        });
      }
    }

    return res.status(200).json({ reply: aiMessage.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'המוח נתקע, נסה שנית' });
  }
}
