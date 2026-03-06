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

// --- ניהול היסטוריה וזיכרון איציק (Firebase itzik_history) ---

// פונקציה לשמירת הודעה בהיסטוריה של איציק
async function saveToItzikHistory(text, sender) {
    const historyRef = ref(db, `itzik_history/${USER_ID}`);
    const newEntryRef = push(historyRef);
    await set(newEntryRef, {
        text: text,
        sender: sender,
        timestamp: Date.now(),
        device: /mobile/i.test(navigator.userAgent) ? "mobile" : "desktop"
    });
}

// טעינת היסטוריה בכניסה לאפליקציה
function loadItzikHistory() {
    const historyRef = query(ref(db, `itzik_history/${USER_ID}`), limitToLast(10));
    onValue(historyRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const chatBox = document.getElementById('chat-box');
            chatBox.innerHTML = ''; // ניקוי צאט
            Object.values(data).forEach(msg => {
                addMessageToUI(msg.text, msg.sender === 'ai' ? 'ai' : 'user');
            });
        }
    });
}

// --- ניהול סידור קיים ---

const dailyOrders = [
    { time: "07:00", driver: "עלי", client: "זבולון-עדירן/שיין", location: "רעננה", phone: "972508860896" },
    { time: "07:00", driver: "חכמת", client: "בן ענבר", location: "תל אביב", phone: "972502120038" }
];

// הצגת ההזמנות במסך (תומך גם בדשבורד איציק)
function renderOrders() {
    const listDiv = document.getElementById('order-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    dailyOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = "p-3 border rounded border-gray-200 bg-blue-50 text-black text-xs mb-2 shadow-sm";
        card.innerHTML = `<strong>${order.time} | ${order.driver}</strong><br>${order.client} - ${order.location}`;
        listDiv.appendChild(card);
    });
}

// --- שליחת הודעות ל-Gemini ול-WhatsApp ---

window.handleSend = async function() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;

    // 1. הצגה ב-UI
    addMessageToUI(text, 'user');
    input.value = '';

    // 2. שמירה בזיכרון של איציק ב-Firebase
    await saveToItzikHistory(text, 'user');

    // 3. שליחה למוח Gemini (דרך ה-API שלך ב-GitHub)
    try {
        const response = await fetch("/api/gemini", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, user_id: USER_ID })
        });
        const data = await response.json();
        addMessageToUI(data.reply, 'ai');
        await saveToItzikHistory(data.reply, 'ai');
    } catch (err) {
        console.error("Gemini Error:", err);
    }
};

function addMessageToUI(text, type) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    const msg = document.createElement('div');
    msg.className = type === 'user' ? 
        "bg-[#005c4b] mr-auto p-3 rounded-xl max-w-[80%] text-white shadow-md mb-2" : 
        "bg-[#202c33] ml-auto p-3 rounded-xl max-w-[80%] border-r-4 border-blue-500 text-white shadow-md mb-2";
    msg.innerText = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// הפונקציה הקיימת לשליחה ללקוחות דרך JONI
window.sendDailyReport = async function() {
    for (const order of dailyOrders) {
        const message = `*📋 דו"ח הזמנה - ח. סבן*\n\n⏰ ${order.time}\n👤 ${order.client}\n📍 ${order.location}\n🏗️ המנוף בדרך!`;
        const msgRef = ref(db, 'saban94/send');
        const newMsgRef = push(msgRef);
        await set(newMsgRef, { to: order.phone, text: message });
    }
    alert("הדו\"ח נשלח לכל הלקוחות בהצלחה! 🚀");
};

// אתחול
window.onload = () => {
    renderOrders();
    loadItzikHistory();
};
