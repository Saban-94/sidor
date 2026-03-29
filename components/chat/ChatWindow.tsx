// components/chat/ChatWindow.tsx

// בתוך ה-useEffect שבו מוגדר ה-ref:
useEffect(() => {
  // הגנה: אם ה-database לא מאותחל (למשל בזמן Build), אל תמשיך
  if (!database || !customerId) return;

  try {
    const messagesRef = ref(database, `messages/${customerId}`);
    const messagesQuery = query(messagesRef, limitToLast(50));

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      // ... שאר הלוגיקה שלך
    });

    return () => unsubscribe();
  } catch (error) {
    console.error("Firebase database error:", error);
  }
}, [customerId, database]);
