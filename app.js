import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, query, limitToLast } from "firebase/database";

// קונפיגורציה קיימת - ח. סבן
const firebaseConfig = {
  apiKey: "AIzaSyAg1mkCCOs1A7inc4HfPmTND2t26zbgf9A",
  authDomain: "whatsapp-8ffd1.firebaseapp.com",
  databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whatsapp-8ffd1",
  storageBucket: "whatsapp-8ffd1.firebasestorage.app",
  messagingSenderId: "248003330797",
  appId: "1:248003330797:web:db93f4c5b223bfa647c2e4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const USER_ID = "itzik_zehavi";

// --- פונקציות עזר לתצוגה ---

function addMessageToUI(text, type) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    const msg = document.createElement('div');
    // עיצוב ווטסאפ משופר עם ניגודיות גבוהה והפרדה ברורה
    msg.className = type === 'user' ? 
        "bg-[#005c4b] mr-auto p-3 rounded-xl max-w-[80%] text-white shadow-md mb-2 clear-both float-right text-right" : 
        "bg-[#202c33] ml-auto p-3 rounded-xl max-w-[80%] border-r-4 border-blue-500 text-white shadow-md mb-2 clear-both float-left text-right";
    
    msg.innerText = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// --- לוגיקת שליחה וסנכרון ---

async function handleSend() {
    const input = document.getElementById('msg-input');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;

    // 1. תצוגה מיידית ב-UI
    addMessageToUI(text, 'user');
    input.value = '';

    // 2. שמירה ב-Firebase itzik_history לזיכרון ארוך טווח
    try {
        const historyRef = ref(db, `itzik_history/${USER_ID}`);
        push(historyRef, { 
            text, 
            sender: 'user', 
            timestamp: Date.now(),
            device: /mobile/i.test(navigator.userAgent) ? "mobile" : "desktop"
        });

        // 3. שליחה ל-API של Gemini
        const response = await fetch("/api/gemini", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: text, 
                user_id: USER_ID, 
                context: "itzik_mode" 
            })
        });
        
        const data = await response.json();
        if (data.reply) {
            addMessageToUI(data.reply, 'ai');
            push(historyRef, { text: data.reply, sender: 'ai', timestamp: Date.now() });
        }
    } catch (err) {
        console.error("Connection Error:", err);
        addMessageToUI("שגיאה בתקשורת עם השרת. נסה שוב.", 'ai');
    }
}

// --- חיבור אירועים (תיקון לחיצות) ---

document.addEventListener('DOMContentLoaded', () => {
    // זיהוי מכשיר
    const deviceInfo = document.getElementById('device-info');
    if (deviceInfo) {
        deviceInfo.innerText = /mobile/i.test(navigator.userAgent) ? "● מחובר מהסלולרי (PWA)" : "● מחובר מהמחשב (Dashboard)";
    }

    // 1. כפתור שליחה ראשי (מטפל גם ב-z-index)
    const sendBtn = document.getElementById('send-btn') || document.querySelector('button[onclick="handleSend()"]');
    if (sendBtn) {
        sendBtn.removeAttribute('onclick'); // הסרת הישן למניעת כפילות
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleSend();
        });
    }

    // 2. כפתורי "העברה" ו-"הזמנה" (Quick Actions)
    const quickBtns = document.querySelectorAll('button[onclick^="sendQuick"]');
    quickBtns.forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const actionText = btn.innerText.includes('העברה') ? 'אני רוצה לבצע העברה בין סניפים' : 'אני רוצה לבצע הובלה ללקוח';
            const input = document.getElementById('msg-input');
            if (input) {
                input.value = actionText;
                handleSend();
            }
        });
    });

    // 3. תמיכה במקש Enter במקלדת
    const input = document.getElementById('msg-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
            }
        });
    }

    // 4. טעינת היסטוריה מ-Firebase בזמן אמת
    const historyRef = query(ref(db, `itzik_history/${USER_ID}`), limitToLast(15));
    onValue(historyRef, (snapshot) => {
        const chatBox = document.getElementById('chat-box');
        if (chatBox) {
            chatBox.innerHTML = ''; // ניקוי צד לקוח לפני טעינה מחדש
            snapshot.forEach((child) => {
                const msg = child.val();
                addMessageToUI(msg.text, msg.sender);
            });
        }
        const status = document.getElementById('status');
        if (status) status.innerText = "🧠 המוח מסונכרן ומוכן";
    });
});
