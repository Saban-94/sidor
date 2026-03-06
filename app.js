import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, query, limitToLast } from "firebase/database";

// קונפיגורציה קיימת
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

// --- פונקציות עזר לצאט ---

function addMessageToUI(text, type) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    const msg = document.createElement('div');
    // עיצוב ווטסאפ משופר עם ניגודיות גבוהה
    msg.className = type === 'user' ? 
        "bg-[#005c4b] mr-auto p-3 rounded-xl max-w-[80%] text-white shadow-md mb-2 clear-both float-right" : 
        "bg-[#202c33] ml-auto p-3 rounded-xl max-w-[80%] border-r-4 border-blue-500 text-white shadow-md mb-2 clear-both float-left";
    msg.innerText = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// שליחה ל-Gemini ושמירה ב-Firebase
async function handleSend() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;

    addMessageToUI(text, 'user');
    input.value = '';

    // שמירה ב-Firebase itzik_history
    const historyRef = ref(db, `itzik_history/${USER_ID}`);
    push(historyRef, { text, sender: 'user', timestamp: Date.now() });

    try {
        const response = await fetch("/api/gemini", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, user_id: USER_ID, context: "itzik_mode" })
        });
        const data = await response.json();
        if (data.reply) {
            addMessageToUI(data.reply, 'ai');
            push(historyRef, { text: data.reply, sender: 'ai', timestamp: Date.now() });
        }
    } catch (err) {
        console.error("Connection Error:", err);
    }
}

// --- חיבור אירועים (Fix לכפתורים לא לחיצים) ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. כפתור שליחה ראשי
    const sendBtn = document.querySelector('button[onclick="handleSend()"]') || document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.onclick = (e) => { e.preventDefault(); handleSend(); };
    }

    // 2. תמיכה במקש Enter
    const input = document.getElementById('msg-input');
    if (input) {
        input.onkeydown = (e) => { if (e.key === 'Enter') handleSend(); };
    }

    // 3. כפתורי "העברה" ו-"הזמנה" (Quick Actions)
    const quickBtns = document.querySelectorAll('button[onclick^="sendQuick"]');
    quickBtns.forEach(btn => {
        btn.onclick = (e) => {
            const action = btn.innerText.includes('העברה') ? 'אני רוצה לבצע העברה בין סניפים' : 'אני רוצה לבצע הובלה ללקוח';
            input.value = action;
            handleSend();
        };
    });

    // טעינת היסטוריה
    const historyRef = query(ref(db, `itzik_history/${USER_ID}`), limitToLast(15));
    onValue(historyRef, (snapshot) => {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = '';
        snapshot.forEach((child) => {
            const msg = child.val();
            addMessageToUI(msg.text, msg.sender);
        });
    });
});
