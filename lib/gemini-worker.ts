// /lib/gemini-worker.ts
import { database, db } from './firebase';
import { ref, onChildAdded, push, get, serverTimestamp, set } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';

/**
 * SABAN HUB - Gemini Realtime Worker (Checkpoint v20.0)
 * מטרת הקובץ: האזנה להודעות נכנסות, עיבוד ב-Gemini ושליחה לתור היציאה.
 */

const GEMINI_API_ENDPOINT = '/api/gemini'; // שימוש ב-Route הקיים ששלחת
const MSG_DELAY = 3000; // דיליי מובנה למניעת ספאם (ניתן למשוך מ-config)

export function startGeminiWorker() {
    console.log("🚀 Saban Gemini Worker Started - Listening to 'incoming'...");

    const incomingRef = ref(database, 'incoming');
    const processedRef = ref(database, 'processed_messages');

    // מאזין להודעות חדשות ב-RTDB
    onChildAdded(incomingRef, async (snapshot) => {
        const msgId = snapshot.key;
        const msgData = snapshot.val();

        if (!msgData || !msgId) return;

        try {
            // 1. הגנה מפני כפילויות (Idempotency)
            const checkProcessed = await get(ref(database, `processed_messages/${msgId}`));
            if (checkProcessed.exists()) return;

            // סימון מיידי כ"בטיפול" למניעת Race Conditions
            await set(ref(database, `processed_messages/${msgId}`), { 
                status: 'processing', 
                timestamp: serverTimestamp() 
            });

            console.log(`📩 הודעה חדשה מ-${msgData.from}: ${msgData.body}`);

            // 2. שליפת DNA אישי מ-Firestore (הקשר לקוח)
            const customerPhone = msgData.from.replace('@c.us', '');
            const customerSnap = await getDoc(doc(db, 'customers', customerPhone));
            const dnaContext = customerSnap.exists() ? customerSnap.data().dnaContext : "לקוח חדש";

            // 3. פנייה ל-Gemini API (שימוש בלוגיקה הקיימת ב-pages/api/gemini.ts)
            const geminiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${GEMINI_API_ENDPOINT}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msgData.body,
                    senderPhone: customerPhone,
                    name: msgData.pushname || 'אח יקר',
                    state: msgData.currentState || 'MENU'
                })
            });

            const result = await geminiResponse.json();

            if (result.reply) {
                // 4. הכנת אובייקט הודעה לצאת (Outgoing)
                const outgoingMessage = {
                    to: msgData.from,
                    body: result.reply,
                    mediaUrl: result.mediaUrl || null,
                    pdfUrl: result.pdfUrl || null,
                    timestamp: serverTimestamp(),
                    status: 'pending',
                    metadata: {
                        source: 'gemini_ai',
                        processedId: msgId,
                        newState: result.newState
                    }
                };

                // 5. הזרקה לתור השליחה (Outgoing) עם Delay
                setTimeout(async () => {
                    await push(ref(database, 'outgoing'), outgoingMessage);
                    
                    // עדכון סטטוס סופי ב-Firestore/RTDB לתיעוד
                    await set(ref(database, `processed_messages/${msgId}`), {
                        status: 'completed',
                        replySent: true,
                        timestamp: serverTimestamp()
                    });
                    
                    console.log(`✅ תגובה נשלחה ל-${msgData.from}`);
                }, MSG_DELAY);
            }

        } catch (error) {
            console.error(`❌ שגיאה בעיבוד הודעה ${msgId}:`, error);
            await set(ref(database, `processed_messages/${msgId}/status`), 'error');
        }
    });
}
