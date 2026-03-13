// /agents/core/agent.ts

// נטרול זמני של הייבוא הבעייתי כדי לאפשר Build ב-Vercel
// import { tools } from "../tools"; 

export async function processAgentInquiry(message: string, history: any[]) {
  // 1. ניתוח כוונת המשתמש (Intent Analysis) - לוגיקה עתידית
  
  // 2. החלטה: האם צריך כלי? 
  // (כרגע מנוטרל עד שייווצר קובץ הכלים בנתיב המתאים)
  /* if (message.includes("סטטוס הזמנה")) {
    const orderId = message.match(/\d+/)?.[0] || ""; 
    // const result = await tools.crm_lookup.handler({ orderId });
    return {
      content: `מצאתי את ההזמנה שלך! הסטטוס הוא: (בטיפול - דורש חיבור לכלים)`,
      toolUsed: "crm_lookup"
    };
  }
  */

  // 3. תשובה גנרית מבוססת הקשר
  return { 
    content: "שלום! אני העוזר החכם של ח. סבן. איך אני יכול לעזור לך עם חומרי בניין היום?", 
    toolUsed: null 
  };
}
