import { NextRequest, NextResponse } from 'next/server';

// ב-App Router (Next 16), הגדרת גודל מתבצעת ברמת התשתית. 
// הסרנו את ה-config הישן שגרם לשגיאת ה-Build.

export async function POST(req: NextRequest) {
  try {
    // שליפת הנתונים מה-Body בפורמט של App Router
    const body = await req.json();
    const { message, imageBase64 } = body;
    
    const geminiKey = process.env.GEMINI_API_KEY;

    // הגנה: בדיקת מפתח API
    if (!geminiKey) {
      console.error("Missing GEMINI_API_KEY");
      return NextResponse.json(
        { error: "שרת ה-AI לא מוגדר (חסר מפתח)" },
        { status: 500 }
      );
    }

    // הגנה: בדיקת תוכן התמונה
    if (!imageBase64) {
      return NextResponse.json(
        { error: "לא התקבלה תמונה לניתוח" },
        { status: 400 }
      );
    }

    // ניקוי ה-Prefix של ה-Base64 כדי שה-API של Gemini יקבל דאטה נקי
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "אתה המומחה הטכני של ח.סבן. נתח את התמונה ואבחן סדקים, חלודה או צורך באיטום. תן פתרון מקצועי עם מוצרי סיקה/טמבור/תרמוקיר הזמינים במלאי." },
              { 
                inline_data: { 
                  mime_type: "image/jpeg", 
                  data: cleanBase64
                } 
              }
            ]
          }]
        })
      }
    );

    const data = await aiRes.json();

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return NextResponse.json(
        { error: data.error.message },
        { status: 500 }
      );
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "בוס, לא הצלחתי לנתח את התמונה. נסה לצלם שוב מקרוב.";
    
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Runtime Error in tools-brain:", error.message);
    return NextResponse.json(
      { error: "שגיאת שרת פנימית בניתוח הוויזואלי" },
      { status: 500 }
    );
  }
}
