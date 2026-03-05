import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push } from "firebase/database";

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

// דוגמה לנתוני סידור (כמו ששלחת קודם)
const dailyOrders = [
    { time: "07:00", driver: "עלי", client: "זבולון-עדירן/שיין", location: "רעננה", phone: "972508860896" },
    { time: "07:00", driver: "חכמת", client: "בן ענבר", location: "תל אביב", phone: "972502120038" }
];

// הצגת ההזמנות במסך
const listDiv = document.getElementById('order-list');
dailyOrders.forEach(order => {
    const card = document.createElement('div');
    card.className = "p-3 border rounded border-gray-200 bg-blue-50";
    card.innerHTML = `<strong>${order.time} | ${order.driver}</strong><br>${order.client} - ${order.location}`;
    listDiv.appendChild(card);
});

// פונקציית הקסם - שליחה ל-JONI דרך Firebase
window.sendDailyReport = async function() {
    for (const order of dailyOrders) {
        const message = `*📋 דו"ח הזמנה - ח. סבן*\n\n⏰ ${order.time}\n👤 ${order.client}\n📍 ${order.location}\n🏗️ המנוף בדרך!`;
        
        // כתיבה לנתיב ש-JONI מאזין לו
        const msgRef = ref(db, 'saban94/send');
        const newMsgRef = push(msgRef);
        await set(newMsgRef, {
            to: order.phone,
            text: message
        });
    }
    alert("הדו\"ח נשלח לכל הלקוחות בהצלחה! 🚀");
};
