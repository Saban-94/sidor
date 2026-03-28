import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileData, mimeType, GOOGLE_URL } = body;

    if (!GOOGLE_URL) {
      return NextResponse.json({ status: "error", message: "Missing Google URL" }, { status: 400 });
    }

    // שליחה ל-Google Apps Script
    const response = await fetch(GOOGLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    return NextResponse.json(result);

  } catch (err: any) {
    return NextResponse.json({ 
      status: "error", 
      message: "Server Error: " + err.message 
    }, { status: 500 });
  }
}
