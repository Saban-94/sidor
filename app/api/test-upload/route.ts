import { NextRequest, NextResponse } from 'next/server';

// ב-App Router הגדרת גודל גוף ההודעה נעשית כך
export const maxDuration = 60; // זמן ריצה מקסימלי בשניות

export async function POST(request: NextRequest) {
  console.log("--- [מלשינון App Router] בקשה נחתה ב-Route Handler ---");

  try {
    // קריאת הנתונים מהגוף של ה-Request
    const body = await request.json();
    const { fileName, fileData, mimeType, GOOGLE_URL } = body;

    if (!GOOGLE_URL) {
      console.error("❌ שגיאה: חסר URL של גוגל");
      return NextResponse.json({ status: "error", message: "Missing Google URL" }, { status: 400 });
    }

    console.log(`[מלשינון] שולח לגוגל: ${fileName}`);

    // שליחה לגוגל באמצעות fetch המובנה
    const response = await fetch(GOOGLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log("[מלשינון] תשובה סופית מגוגל:", JSON.stringify(result));

    return NextResponse.json(result);

  } catch (err: any) {
    console.error("[מלשינון] קריסה ב-Route:", err.message);
    return NextResponse.json({ 
      status: "error", 
      message: "Server Error: " + err.message 
    }, { status: 500 });
  }
}
