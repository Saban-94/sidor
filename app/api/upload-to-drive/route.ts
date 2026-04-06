import { NextRequest, NextResponse } from 'next/server';

// הגדרות שרת של App Router - אלו מחליפים את ה-config הישן
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // ב-App Router, ה-body נשאב ככה ואין הגבלת bodyParser דיפולטית קשיחה כמו ב-Pages
    const body = await request.json();
    const { fileName, fileData, mimeType, phone } = body;

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuKzJdg7B3Q0Q42IonnWlEgsE_o_Sj2dgqxpHrmU0ro-MYmlismm9LzMnpbn7y8rOj/exec";

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
      return NextResponse.json({ link: result.link });
    }
    
    return NextResponse.json({ error: result.message }, { status: 500 });

  } catch (error: any) {
    console.error("Upload Route Error:", error.message);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}
