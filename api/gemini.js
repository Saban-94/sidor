<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>Saban AI Enterprise | Keyboard Fixed</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: 'Assistant', sans-serif; background: #f0f2f5; height: 100vh; display: flex; overflow: hidden; margin: 0; }
        .sidebar { width: 350px; background: white; border-left: 1px solid #ddd; z-index: 50; display: flex; flex-direction: column; }
        .chat-area { flex: 1; background: #e5ddd5 url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); display: flex; flex-direction: column; position: relative; }
        #chat-canvas { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 10; }
        .bubble { max-width: 65%; padding: 10px; border-radius: 8px; font-size: 14px; box-shadow: 0 1px 1px rgba(0,0,0,0.1); }
        .bubble-in { background: white; align-self: flex-start; }
        .bubble-out { background: #dcf8c6; align-self: flex-end; }
        
        /* תיקון לחיצה ומקלדת */
        footer { background: #f0f2f5; padding: 15px; display: flex; align-items: center; gap: 12px; z-index: 999; border-top: 1px solid #ddd; }
        #msg-input { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #ccc; outline: none; background: white; z-index: 1000; pointer-events: auto !important; }
        #send-btn { cursor: pointer; color: #54656f; font-size: 22px; z-index: 1000; }
    </style>
</head>
<body>

    <aside class="sidebar shadow-lg">
        <header class="p-4 bg-[#f0f2f5] border-b font-bold text-slate-700 italic">ח. סבן AI - ניהול</header>
        <div id="customer-list" class="flex-1 overflow-y-auto"></div>
    </aside>

    <main class="chat-area">
        <header class="h-[60px] bg-[#f0f2f5] border-b p-3 flex items-center gap-3 z-20 shadow-sm">
            <div id="status-pulse" class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span id="active-name" class="font-bold text-sm">בחר שיחה מהרשימה</span>
        </header>

        <div id="chat-canvas"></div>

        <footer>
            <input id="msg-input" type="text" placeholder="הקלד הודעה ולחץ Enter..." autocomplete="off">
            <button id="send-btn"><i class="fas fa-paper-plane"></i></button>
        </footer>
    </main>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        import { getDatabase, ref, onChildAdded, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

        const firebaseConfig = {
            apiKey: "AIzaSyAg1mkCCOs1A7inc4HfPmTND2t26zbgf9A",
            authDomain: "whatsapp-8ffd1.firebaseapp.com",
            projectId: "whatsapp-8ffd1",
            databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const rtdb = getDatabase(app);

        // פונקציית שליחה מרכזית
        async function sendMessage() {
            const input = document.getElementById('msg-input');
            const phone = document.getElementById('active-name').innerText;
            const text = input.value.trim();

            if (!text || phone === "בחר שיחה מהרשימה") return;

            // שליחה ל-RTDB (צינור JONI)
            await push(ref(rtdb, 'saban94/send'), { to: phone, text: text, timestamp: Date.now() });
            
            // תיעוד ב-Firestore לממשק
            await addDoc(collection(db, "customers", phone, "chat_history"), { text: text, type: 'out', timestamp: serverTimestamp() });
            
            input.value = '';
            input.focus();
        }

        // מאזין למקלדת (Enter)
        document.getElementById('msg-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // מאזין לכפתור
        document.getElementById('send-btn').onclick = sendMessage;

        // האזנה להודעות נכנסות מ-JONI
        onChildAdded(ref(rtdb, 'saban94/incoming'), async (snap) => {
            const data = snap.val();
            if(!data) return;
            const phone = data.from.toString();

            await setDoc(doc(db, "customers", phone), { lastUpdate: serverTimestamp() }, { merge: true });
            await addDoc(collection(db, "customers", phone, "chat_history"), { text: data.text, type: 'in', timestamp: serverTimestamp() });

            // Autopilot
            if (data.time > Date.now() - 30000) {
                const res = await fetch('/api/gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: data.text, senderPhone: phone })
                });
                const ai = await res.json();
                if(ai.reply) await push(ref(rtdb, 'saban94/send'), { to: phone, text: ai.reply, timestamp: Date.now() });
            }
        });

        // רשימת לקוחות
        onSnapshot(query(collection(db, "customers"), orderBy("lastUpdate", "desc")), (snap) => {
            const list = document.getElementById('customer-list');
            list.innerHTML = '';
            snap.forEach(d => {
                const item = document.createElement('div');
                item.className = "p-4 border-b hover:bg-gray-100 cursor-pointer font-bold text-gray-700";
                item.innerText = d.id === '972508861080' ? 'ראמי (פרטי)' : d.id;
                item.onclick = () => loadChat(d.id);
                list.appendChild(item);
            });
        });

        window.loadChat = (phone) => {
            document.getElementById('active-name').innerText = phone;
            document.getElementById('msg-input').focus();
            const q = query(collection(db, "customers", phone, "chat_history"), orderBy("timestamp", "asc"));
            onSnapshot(q, (snap) => {
                const canvas = document.getElementById('chat-canvas');
                canvas.innerHTML = '';
                snap.forEach(docSnap => {
                    const m = docSnap.data();
                    canvas.insertAdjacentHTML('beforeend', `<div class="bubble ${m.type === 'in' ? 'bubble-in' : 'bubble-out'}">${m.text}</div>`);
                });
                canvas.scrollTop = canvas.scrollHeight;
            });
        };
    </script>
</body>
</html>
