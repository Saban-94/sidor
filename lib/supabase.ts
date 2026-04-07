import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseInstance: any;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'saban-os-auth-v1'
      }
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabase();

/**
 * Get product image URL from Supabase storage
 */
export async function getProductImageUrl(bucketName: string, path: string): Promise<string | null> {
  try {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (error) {
    console.log('[v0] Error getting product image:', error);
    return null;
  }
}

/**
 * Get product details from database
 */
export async function getProductByName(productName: string) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${productName}%`)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.log('[v0] Error fetching product:', error);
    return null;
  }
}

/**
 * Get all products
 */
export async function getProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.log('[v0] Error fetching products:', error);
    return [];
  }
}

/**
 * Update product stock
 */
export async function updateProductStock(productId: string, newStock: number) {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.log('[v0] Error updating stock:', error);
    return null;
  }
}
