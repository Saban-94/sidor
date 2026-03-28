import { NextRequest, NextResponse } from 'next/server';

// ב-App Router הגדרות אלו מחליפות את ה-config הישן
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log("--- [Saban Drive] Request received in App Router ---");

  try {
    // קריאת הנתונים מהגוף של ה-Request
    const body = await request.json();
    const { fileName, fileData, mimeType, phone } = body;

    // ה-URL שקיבלת מה-Deploy בגוגל (זה שעבר את הבדיקה הידנית שלך)
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuKzJdg7B3Q0Q42IonnWlEgsE_o_Sj2dgqxpHrmU0ro-MYmlismm9LzMnpbn7y8rOj/exec";

    // שליחה ל-Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        fileData,
        mimeType,
        phone
      }),
    });

    const result = await response.json();

    if (result.status === 'success') {
      console.log("[Saban Drive] Upload successful!");
      return NextResponse.json({ link: result.link });
    } else {
      console.error("[Saban Drive] Google error:", result.message);
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error("[Saban Drive] Server Crash:", error.message);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}
