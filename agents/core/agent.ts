// /agents/core/agent.ts
// נטרול זמני של הכלים החסרים כדי לאפשר Build
// import { tools } from "../tools"; 

export async function processAgentInquiry(message: string, history: any[]) {
  // 1. ניתוח כוונת המשתמש (Intent Analysis)
  
  // 2. החלטה: האם צריך כלי? (מנוטרל זמנית בגלל חוסר בקובץ tools)
  /* if (message.includes("סטטוס הזמנה")) {
    const orderId = message.match(/\d+/)?.[0] || ""; // פונקציה פשוטה לחילוץ מספר
    // const result = await tools.crm_lookup.handler({ orderId });
    return {
      content: `מצאתי את ההזמנה שלך! הסטטוס הוא: (בטיפול - דורש חיבור לכלים)`,
      toolUsed: "crm_lookup"
    };
  }
  */

  // 3. תשובה גנרית מבוססת הקשר
  return { 
    content: "שלום! אני העוזר של ח. סבן. איך אני יכול לעזור לך עם חומרי בניין היום?", 
    toolUsed: null 
  };
}
