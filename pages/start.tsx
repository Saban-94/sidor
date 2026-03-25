import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Phone, Building2, ChevronLeft, Sparkles, CalendarCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 1. אתחול Firebase (בטוח מול Vercel)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

export default function MagicLinkEntry() {
  const router = useRouter();
  const { ref } = router.query; // שואב את הפרמטר מה-URL (למשל harel_ceo או מספר טלפון)

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // נתוני לקוח (חדש או קיים)
  const [knownUser, setKnownUser] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // 2. זיהוי "לינק הקסם" בטעינת העמוד
  useEffect(() => {
    if (!router.isReady) return;

    const checkMagicLink = async () => {
      if (ref && typeof ref === 'string') {
        try {
          const docRef = doc(dbFS, 'customers', ref);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            // הלקוח מוכר במערכת! נציג לו מסך VIP
            setKnownUser({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (err) {
          console.error("שגיאה בסריקת לקוח:", err);
        }
      }
      setIsLoading(false);
    };

    checkMagicLink();
  }, [router.isReady, ref]);

  // 3. כניסה מהירה (לקוח קיים / VIP)
  const handleVipEnter = async () => {
    if (!knownUser) return;
    setIsSubmitting(true);
    try {
      // עדכון זמן כניסה ב-CRM כדי שראמי ידע שהוא מחובר
      await setDoc(doc(dbFS, 'customers', knownUser.id), {
        lastLoginAt: serverTimestamp(),
      }, { merge: true });
      
      router.push(`/chat/${knownUser.id}`);
    } catch (e) {
      setError('שגיאה ביצירת החיבור. נסה שוב.');
      setIsSubmitting(false);
    }
  };

  // 4. הרשמת לקוח חדש / מזדמן
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('אנא הזן שם ומספר טלפון כדי להמשיך.');
      return;
    }

    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 9) {
      setError('מספר הטלפון שהוזן אינו תקין.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const customerRef = doc(dbFS, 'customers', cleanPhone);
      await setDoc(customerRef, {
        id: cleanPhone,
        name: name.trim(),
        relation: 'לקוח כללי', // החיווי המיוחד לראמי במסך ה-CRM
        isNew: true,
        invitedByRef: ref || null, // אם הגיע מלינק קסם של מישהו אחר
        lastLoginAt: serverTimestamp(),
      }, { merge: true });

      router.push(`/chat/${cleanPhone}`);
    } catch (err: any) {
      console.error('Error creating customer:', err);
      setError('אירעה שגיאה בחיבור למערכת. נסה שוב.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          טוען לינק קסם...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center items-center p-4 font-sans" dir="rtl">
      <Head>
        <title>כניסה לחדר פגישות | ח. סבן</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 relative"
      >
        {/* כותרת מעוצבת עליונה */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-30"></div>
          
          <div className="w-20 h-20 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg border-2 border-white/10 relative z-10">
            <Building2 size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white relative z-10 tracking-tight">ח. סבן <span className="text-emerald-400">1994</span></h1>
          <p className="text-slate-400 font-bold mt-2 relative z-10">מערכת קשרי לקוחות ופגישות</p>
        </div>

        <AnimatePresence mode="wait">
          {knownUser ? (
            /* ========================================= */
            /* מסך VIP ללקוח מזוהה (למשל: הראל)          */
            /* ========================================= */
            <motion.div 
              key="vip-screen"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="p-8 text-center space-y-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-2">
                <Sparkles size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">אהלן, {knownUser.name}!</h2>
                <p className="text-slate-500 mt-2 font-medium">ראמי ממתין לך בחדר הפגישות המאובטח. הכל מוכן לתחילת השיחה.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 text-right">
                <CalendarCheck className="text-blue-500 shrink-0" size={24} />
                <div>
                  <div className="font-bold text-sm text-slate-800">פגישה דיגיטלית</div>
                  <div className="text-xs text-slate-500">ערוץ מאובטח פתוח כעת</div>
                </div>
              </div>

              <button 
                onClick={handleVipEnter}
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg py-5 rounded-2xl shadow-xl hover:shadow-2xl active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">מתחבר... <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></span>
                ) : (
                  <span className="flex items-center gap-2">היכנס לחדר הפגישה <ArrowRight size={20} /></span>
                )}
              </button>
            </motion.div>
          ) : (
            /* ========================================= */
            /* מסך הרשמה ללקוח חדש / לא מזוהה             */
            /* ========================================= */
            <motion.div 
              key="register-screen"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="p-8 space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-black text-slate-800">ברוך הבא למערכת</h2>
                <p className="text-sm text-slate-500 mt-1">אנא הזן את פרטיך כדי לפתוח ערוץ ישיר</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <User size={14} className="text-emerald-500" /> איך קוראים לך?
                  </label>
                  <input 
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="שם פרטי / חברה"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-slate-800"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Phone size={14} className="text-blue-500" /> מספר נייד
                  </label>
                  <input 
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="05X-XXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-slate-800 dir-ltr text-right"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center border border-red-100">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-slate-900 text-white font-black text-lg py-5 rounded-xl shadow-xl hover:shadow-2xl active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 mt-4"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">מייצר ערוץ... <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></span>
                  ) : (
                    <span className="flex items-center gap-2">כניסה למערכת <ChevronLeft size={20} /></span>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
