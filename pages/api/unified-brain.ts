import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // השתמש ב-Service Role לשליפה בטוחה מהשרת
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body;
  const cleanMsg = message?.trim();

  if (!cleanMsg) return res.status(200).json({ reply: "בוס, לא כתבת כלום. איך אני יכול לעזור?" });
  if (!GEMINI_API_KEY) return res.status(200).json({ reply: "⚠️ שגיאת תצורה: חסר מפתח API של Gemini." });

  try {
    // 1. שלב "הבנת הקשר" - חיפוש מידע ב-Supabase לפי מילות מפתח
    let context = "";
    
    // בדיקה אם השאלה קשורה למכולות
    if (cleanMsg.includes("מכולה") || cleanMsg.includes("מכולות")) {
      const { data: containers } = await supabase.from('containers').select('*');
      if (containers) {
        context += "מידע על מכולות: " + containers.map(c => `מכולה ${c.id}: סטטוס ${c.status}, מיקום ${c.location || 'במגרש'}`).join(", ") + ". ";
      }
    }

    // בדיקה אם השאלה קשורה לסידור עבודה
    if (cleanMsg.includes("סידור") || cleanMsg.includes("נהג") || cleanMsg.includes("הזמנ")) {
      const today = new Date().toISOString().split('T')[0];
      const { data: sidor } = await supabase.from('sidor_entries').select('*').eq('date', today);
      if (sidor && sidor.length > 0) {
        context += "סידור עבודה להיום: " + sidor.map(s => `נהג ${s.driver}: ${s.task} ב-${s.time}`).join(", ") + ". ";
      } else {
        context += "אין עדיין סידור עבודה מעודכן להיום בטבלה. ";
      }
    }

    // חיפוש ב-Knowledge Hub (נהלים)
    const { data: kb } = await supabase.from('knowledge_base').select('*');
    if (kb) {
      const relevantKb = kb.filter(item => 
        cleanMsg.includes(item.question) || item.question.includes(cleanMsg) || 
        item.category.includes(cleanMsg)
      );
      if (relevantKb.length > 0) {
        context += "נהלים רלוונטיים: " + relevantKb.map(k => `${k.question}: ${k.answer}`).join(" | ") + ". ";
      }
    }

    // 2. פנייה למודל Gemini 3.1 (עדכון מרץ 2026)
    const model = "gemini-3.1-flash-lite-preview"; // מומלץ ליציבות ומהירות ב-API
    const prompt = `
      אתה "המוח המאוחד" של חברת "ה. סבן חומרי בניין". 
      תפקידך לענות לאנשי הארגון בצורה מקצועית, קצרה וחדה (בסגנון 'אח על מלא').
      השתמש בהקשר הבא כדי לענות על השאלה:
      ---
      הקשר (Context): ${context || "אין מידע ספציפי כרגע, ענה לפי ידע כללי של העסק"}
      ---
      שאלה: ${cleanMsg}
      
      הנחיות:
      1. אם אין מידע על סידור או מכולה ספציפית, ציין שזה לא מופיע בסידור כרגע.
      2. ענה תמיד בעברית.
      3. סיים כל תשובה בברכת "סבן - מנצחים כל פרויקט".
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const aiData = await response.json();
    const reply = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "בוס, המוח קצת עמוס כרגע, נסה שוב עוד דקה.";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Brain Error:", error);
    return res.status(200).json({ reply: "בוס, תקלה בהזרקה. וודא שהטבלאות ב-Supabase מחוברות." });
  }
}
