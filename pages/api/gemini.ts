import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const { message, senderPhone } = req.body;
  const cleanMsg = (message || "").trim();

  // --- הגנות בסיס - חוקי ראמי ---
  if (!cleanMsg) return res.status(200).json({ reply: "בוס, הודעה ריקה?" });
  if (!apiKey) return res.status(200).json({ reply: "⚠️ שגיאת מפתח." });

  const modelPool = ["gemini-3.1-flash-lite-preview", "gemini-2.0-flash", "gemini-1.5-flash"];

  try {
    const phone = senderPhone?.replace('@c.us', '') || 'unknown';

    // 1. שליפה ויצירת משתמש אם חסר
    let { data: memory } = await supabase.from('customer_memory').select('accumulated_knowledge').eq('clientId', phone).maybeSingle();
    if (!memory) {
      const { data: newUser } = await supabase.from('customer_memory').insert([{ clientId: phone, accumulated_knowledge: '' }]).select().single();
      memory = newUser;
    }

    let history = memory?.accumulated_knowledge || "";
    if (cleanMsg === "הוסף הזמנה") history = "";
    const localUpdatedHistory = history + `\nUser: ${cleanMsg}`;

// 2. בניית ה-Prompt עם דגש על JSON קשיח הכולל תאריך ושעה
    const prompt = `
      זהות: העוזר האישי של ראמי מסבן חומרי בניין. סגנון: קצר, מקצועי, תכליתי.
      
      עץ שאלות חובה (לפי הסדר):
      1. מי הלקוח?
      2. מה הכתובת למשלוח?
      3. מאיזה מחסן (החרש/התלמיד)?
      4. באיזה תאריך האספקה?
      5. באיזו שעה (במשבצות של 00 או 30, למשל 08:30)?
      6. איזה נהג (חכמת/עלי)?

      היסטוריה: ${localUpdatedHistory}

      חוק הזרקה (קריטי):
      רק לאחר שהמשתמש נתן את כל הפרטים (כולל נהג, תאריך ושעה), ענה: "הוזרק ללוח. 🚀" 
      וחייב להוסיף JSON מדויק בפורמט הזה:
      DATA_START{
        "complete": true, 
        "client": "שם הלקוח", 
        "address": "הכתובת", 
        "branch": "המחסן", 
        "date": "YYYY-MM-DD", 
        "time": "HH:mm", 
        "driver": "שם הנהג"
      }DATA_END

      דגש: אל תאשר הזרקה עד שאין לך את התאריך והשעה המדויקים מהמשתמש.
    `;

    // 3. רוטציית מודלים
    let replyText = "";
    for (const modelName of modelPool) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        replyText = data.candidates[0].content.parts[0].text.trim();
        if (replyText) break;
      } catch (e) { continue; }
    }

    let finalReply = replyText;
    let isComplete = false;

// המשך סעיף 4: ביצוע הזרקה ל-Supabase
          const { error: insertError } = await supabase.from('orders').insert([{
            client_info: d.client || "לקוח לא ידוע",
            location: d.address || "כתובת חסרה",
            source_branch: d.branch || "כללי",
            driver_name: driverName, // "עלי" או "חכמת"
            order_time: finalOrderTime, // מעוגל ל-00 או 30
            delivery_date: new Date().toISOString().split('T')[0],
            status: 'pending'
          }]);

          if (!insertError) {
            // הזרקה הצליחה - המוח מחזיר אישור סופי
            finalReply = `בוס, הזמנה עבור ${d.client || 'הלקוח'} הוזרקה ללוח של ${driverName} לשעה ${finalOrderTime}. 🚀`;
            isComplete = true;
          } else {
            // טיפול במקרה של שגיאת Database (למשל חסימת RLS)
            console.error("Supabase Insert Error:", insertError);
            finalReply = "בוס, הצלחתי להבין את הפרטים אבל הייתה שגיאה ברישום ללוח. בדוק את חיבור ה-Database.";
          }
        }
      } catch (e) {
        console.error("JSON Parsing Error:", e);
        finalReply = "בוס, המידע חולץ אבל ה-JSON לא היה תקין. נסה שוב.";
      }
    }

    // 5. עדכון זיכרון (איפוס אם הוזרק, אחרת שמירת היסטוריה)
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${finalReply}`;
    await supabase
      .from('customer_memory')
      .update({ accumulated_knowledge: newHistory })
      .eq('clientId', phone);

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    console.error("General API Error:", e);
    return res.status(200).json({ reply: "בוס, קרתה תקלה קטנה במוח. תכתוב לי שוב את הפקודה." });
  }
}

          // הזרקה לטבלת orders
          const { error: insertError } = await supabase.from('orders').insert([{
            client_info: d.client || "לקוח לא ידוע",
            location: d.address || "כתובת חסרה",
            source_branch: d.branch || "כללי",
            driver_name: driverName, 
            order_time: finalOrderTime, 
            delivery_date: new Date().toISOString().split('T')[0],
            status: 'pending'
          }]);

          if (!insertError) {
            finalReply = `הוזרק ללוח של ${driverName} בשעה ${finalOrderTime}. 🚀`;
            isComplete = true;
          } else {
            console.error("Supabase Error:", insertError);
            finalReply = "בוס, המידע חולץ אבל ה-Database חסום. בדוק הרשאות RLS.";
          }
        }
      } catch (e) {
        console.error("JSON Parse Error:", e);
      }
    }

          // הזרקה לטבלת orders עם התאמה מלאה ללוח הנהגים
          const { error: insertError } = await supabase.from('orders').insert([{
            client_info: d.client,
            location: d.address,
            source_branch: d.branch,
            driver_name: d.driver, // חייב להיות "חכמת" או "עלי"
            order_time: finalOrderTime, // השעה שמתאימה למשבצת בלוח
            delivery_date: new Date().toISOString().split('T')[0],
            status: 'pending'
          }]);

          if (!insertError) {
            finalReply = `הוזרק ללוח של ${d.driver} לשעה ${finalOrderTime}. 🚀`;
            isComplete = true;
          } else {
            console.error("Supabase Insert Error:", insertError);
            finalReply = "בוס, המידע חולץ אבל יש תקלה ברישום ללוח. בדוק הרשאות.";
          }
        }
      } catch (e) { 
        console.error("JSON Parse Error", e); 
      }
    }

    // 5. עדכון זיכרון (איפוס אם הוזרק, אחרת צבירה)
    const newHistory = isComplete ? "" : localUpdatedHistory + `\nAssistant: ${finalReply}`;
    await supabase.from('customer_memory').update({ accumulated_knowledge: newHistory }).eq('clientId', phone);

    return res.status(200).json({ reply: finalReply });

  } catch (e) {
    return res.status(200).json({ reply: "בוס, תקלה בביצוע. נסה שוב." });
  }
}
