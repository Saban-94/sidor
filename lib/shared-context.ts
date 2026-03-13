// /lib/shared-context.ts
import { supabase } from "./realtime/supabase";

export async function getSabanContext(agentType: 'executor' | 'consultant') {
  try {
    // שליפת חוקים ומלאי קריטי בפעימה אחת
    const [rules, inventory] = await Promise.all([
      supabase.from('system_rules').select('instruction').eq('agent_type', agentType).eq('is_active', true),
      supabase.from('inventory').select('product_name, sku, stock_quantity').lt('stock_quantity', 5)
    ]);

    return {
      dna: rules.data?.map(r => r.instruction).join("\n") || "",
      lowStockAlerts: inventory.data || []
    };
  } catch (e) {
    console.error("Context fetch error:", e);
    return { dna: "", lowStockAlerts: [] };
  }
}
