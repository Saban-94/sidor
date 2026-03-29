import { app } from './firebase';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * פונקציה להפעלת ה-AI באופן בטוח
 */

// יצירת ה-Instance של Firestore רק אם האפליקציה קיימת
const dbFS = app ? getFirestore(app) : null;
const GEMINI_API_ENDPOINT = '/api/gemini';
const MSG_DELAY = 3000;

export const processAILogic = async (customerId: string, text: string) => {
  // הגנה: אם אין חיבור למאגר (למשל בזמן Build), אל תבצע פעולה
  if (!dbFS || !customerId) return;

  try {
    const aiDoc = doc(dbFS, 'ai_processing', customerId);
    
    // שליחה ל-API של Gemini ועדכון הסטטוס ב-Firestore
    await setDoc(aiDoc, {
      last_input: text,
      status: 'processing',
      updated_at: serverTimestamp()
    }, { merge: true });

    // כאן תבוא לוגיקת הפנייה ל-API
    console.log(`Processing AI for customer: ${customerId}`);
    
  } catch (error) {
    console.error("Gemini Worker Error:", error);
  }
};
