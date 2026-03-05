// /agents/core/agent.ts
import { tools } from "../tools";

export async function processAgentInquiry(message: string, history: any[]) {
  // 1. ניתוח כוונת המשתמש (Intent Analysis)
  // 2. החלטה: האם צריך כלי? (למשל CRM או חיפוש ידע)
  if (message.includes("סטטוס הזמנה")) {
    const orderId = extractOrderId(message);
    const result = await tools.crm_lookup.handler({ orderId });
    return {
      content: `מצאתי את ההזמנה שלך! הסטטוס הוא: ${result.status}`,
      toolUsed: "crm_lookup"
    };
  }

  // 3. תשובה גנרית מבוססת הקשר
  return { content: "איך אני יכול לעזור לך עם חומרי הבניין היום?", toolUsed: null };
}
