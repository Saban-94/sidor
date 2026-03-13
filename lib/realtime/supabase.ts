import { supabase } from "./realtime/supabase";
// 1. הגדרת משתנים עם Fallback למניעת קריסת Build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqslrnbduxtxsvwqryxq.supabase.co';

// עדיפות ל-Service Role Key בשרת (Vercel) בשביל עקיפת RLS, ו-Anon Key כגיבוי
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'placeholder-key-missing';

/**
 * יצירת הלקוח של Supabase.
 * persistSession: false - קריטי ב-Next.js API Routes למניעת שגיאות זיכרון.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

/**
 * פונקציית עזר לבדיקה האם המערכת מוכנה לעבודה מול המאגר
 */
export const isSupabaseReady = () => {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return hasUrl && hasKey;
};

// ייצוא המפתחות לשימוש בקבצים אחרים (כמו ב-Product App)
export const supabaseConfig = { url: supabaseUrl, key: supabaseKey };
