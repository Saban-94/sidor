import { database } from './firebase'; // RTDB
import { ref, onChildAdded, push, get, serverTimestamp, set } from 'firebase/database';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; 
import { app } from './firebase';

/**
 * SABAN HUB - Gemini Realtime Worker (Checkpoint v20.1 - FIXED)
 * תיקון: הפרדה ברורה בין RTDB ל-Firestore ומניעת שגיאות Type.
 */

const dbFS = getFirestore(app); // Instance נפרד ל-Firestore
const GEMINI_API_ENDPOINT = '/api/gemini';
const MSG_DELAY = 3000;

export function startGeminiWorker() {
    console.log("🚀 Saban Gemini Worker Started - Listening to 'incoming'...");

    const incomingRef = ref(database, 'incoming');

    onChildAdded(incomingRef, async (snapshot) => {
        const msgId = snapshot.key;
        const msgData = snapshot.val();

        if (!msgData || !msgId) return;

        try {
            // 1. הגנה מפני כפילויות (Idempotency)
            const checkProcessed = await get(ref(database, `processed_messages/${msgId}`));
            if (checkProcessed.exists()) return;

            // סימון בטיפול
            await set(ref(database, `processed_messages/${msgId}`), { 
                status: 'processing', 
                timestamp: serverTimestamp() 
            });

            console.log(`📩 הודעה חדשה מ-${msgData.from}: ${msgData.body}`);

            // 2. שליפת DNA אישי מ-Firestore - שימוש ב-dbFS המתוקן
            const customerPhone = msgData.from.replace('@c.us', '');
            let dnaContext = "לקוח חדש";
            
            try {
                const customerSnap = await getDoc(doc(dbFS, 'customers', customerPhone));
                if (customerSnap.exists()) {
                    dnaContext = customerSnap.data().dnaContext || "לקוח רגיל";
                }
            } catch (fsError) {
                console.error("Firestore DNA Fetch Error:", fsError);
            }

            // 3. פנייה ל-Gemini API
            // הערה: וודא ש-NEXT_PUBLIC_BASE_URL מוגדר ב-Vercel (למשל: https://your-domain.vercel.app)
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
            const geminiResponse = await fetch(`${baseUrl}${GEMINI_API_ENDPOINT}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msgData.body,
                    senderPhone: customerPhone,
                    name: msgData.pushname || 'אח יקר',
                    state: msgData.currentState || 'MENU'
                })
            });

            if (!geminiResponse.ok) throw new Error(`Gemini API error: ${geminiResponse.statusText}`);

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

                // 5. הזרקה לתור השליחה עם הדיליי המבוקש
                setTimeout(async () => {
                    const outgoingRef = ref(database, 'outgoing');
                    await push(outgoingRef, outgoingMessage);
                    
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
            await set(ref(database, `processed_messages/${msgId}`), {
                status: 'error',
                error: error instanceof Error ? error.message : String(error),
                timestamp: serverTimestamp()
            });
        }
    });
}
