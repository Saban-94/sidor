require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');

// --- אתחול Firebase Admin ---
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://whatsapp-8ffd1-default-rtdb.europe-west1.firebasedatabase.app/"
  });
}

const db = admin.database();
const incomingRef = db.ref('saban94/incoming');
const outgoingRef = db.ref('saban94/outgoing');

console.log("🚀 מאתחל שרת WhatsApp Bridge עם מנגנון איחוד זהויות...");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    }
});

client.on('qr', (qr) => {
    console.log('\n📱 סרוק את הברקוד לחיבור הצינור המרכזי:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ הווטסאפ מחובר ומוכן לעבודה מול JONI!');
});

// --- מאזין להודעות נכנסות (כאן קורה הקסם של msg.author) ---
client.on('message', async (msg) => {
    if (msg.isStatus) return;

    try {
        const chat = await msg.getChat();
        const contact = await msg.getContact();

        // 🔥 המפתח לאיחוד: בשיחה פרטית משתמשים ב-from, בקבוצה משתמשים ב-author
        const senderId = chat.isGroup ? msg.author : msg.from;
        
        // ניקוי המספר לקבלת UID נקי (למשל 97254...)
        const cleanPhone = senderId.replace(/\D/g, '');
        
        // חילוץ שם השולח
        const senderName = contact.pushname || contact.name || 'לקוח';

        console.log(`📥 הודעה מ-${senderName} (${cleanPhone}) | מקור: ${chat.isGroup ? 'קבוצה' : 'פרטי'}`);

        // דחיפה ל-Firebase RTDB - הצינור שמזין את ה-Operational Hub
        await incomingRef.push({
            sender: cleanPhone,         // זה המזהה המאוחד ל-CRM
            name: senderName,
            text: msg.body,
            source: chat.isGroup ? 'group' : 'private',
            groupName: chat.isGroup ? chat.name : null,
            timestamp: admin.database.ServerValue.TIMESTAMP
        });

    } catch (err) {
        console.error('❌ שגיאה בעיבוד הודעה נכנסת:', err.message);
    }
});

// --- מאזין להודעות יוצאות מהממשק (JONI Outgoing) ---
outgoingRef.on('child_added', async (snapshot) => {
    const data = snapshot.val();
    const key = snapshot.key;
    if (!data || !data.number || !data.message) return;

    try {
        let phoneId = String(data.number).replace(/\D/g, '');
        
        // בניית כתובת יעד (תמיכה בקבוצות ובמספרים פרטיים)
        let targetId = phoneId.includes('-') ? `${phoneId}@g.us` : `${phoneId}@c.us`;

        // שליחת ההודעה
        if (data.mediaUrl && data.mediaUrl.startsWith('http')) {
            const media = await MessageMedia.fromUrl(data.mediaUrl);
            await client.sendMessage(targetId, media, { caption: data.message });
        } else {
            await client.sendMessage(targetId, data.message);
        }

        console.log(`📤 נשלח ל-${targetId}: ${data.message.substring(0, 30)}...`);
        
        // מחיקה מהתור לאחר שליחה מוצלחת
        await outgoingRef.child(key).remove();
    } catch (err) {
        console.error(`❌ שגיאה בשליחת הודעה ל-${data.number}:`, err.message);
    }
});

client.initialize();
