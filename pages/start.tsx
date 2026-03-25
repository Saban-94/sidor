import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, User, Phone, HardHat, Building2, ChevronLeft } from 'lucide-react';

// 1. אתחול Firebase (חסין Vercel)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const dbFS = getFirestore(app);

export default function MagicLinkEntry() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('אנא הזן שם ומספר טלפון כדי להמשיך.');
      return;
    }

    // ניקוי מספר הטלפון מתווים מיותרים (משאיר רק מספרים ופלוס)
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    if (cleanPhone.length < 9) {
      setError('מספר הטלפון שהוזן אינו תקין.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 2. יצירת/עדכון כרטיס לקוח ב-CRM (מתויג כ"לקוח כללי")
      const customerRef = doc(dbFS, 'customers', cleanPhone);
      await setDoc(customerRef, {
        id: cleanPhone,
        name: name.trim(),
        relation: 'לקוח כללי', // החיווי המיוחד לראמי במסך ה-CRM
        isNew: true,
        lastLoginAt: serverTimestamp(),
      }, { merge: true });

      // 3. הפניה אוטומטית לערוץ הצ'אט האישי שהכנו מראש
      router.push(`/chat/${cleanPhone}`);
      
    } catch (err: any) {
      console.error('Error creating customer:', err);
      setError('אירעה שגיאה בחיבור למערכת. נסה שוב.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans" dir="rtl">
      <Head>
        <title>כניסה | ח. סבן חומרי בניין</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 relative">
        {/* כותרת מעוצבת */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-30"></div>
          
          <div className="w-20 h-20 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg border-2 border-white/10 relative z-10">
            <Building2 size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white relative z-10 tracking-tight">ח. סבן <span className="text-emerald-400">1994</span></h1>
          <p className="text-slate-400 font-bold mt-2 relative z-10">העוזר הלוגיסטי והטכני שלך</p>
        </div>

        {/* טופס הרשמה מהיר */}
        <form onSubmit={handleStartChat} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                <User size={14} className="text-emerald-500" /> איך קוראים לך?
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם פרטי / חברה"
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-slate-800"
              />
            </div>
            
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1">
                <Phone size={14} className="text-blue-500" /> מספר נייד (לשמירת היסטוריה)
              </label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05X-XXXXXXX"
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-slate-800 dir-ltr text-right"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center border border-red-100">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white font-black text-lg py-5 rounded-xl shadow-xl hover:shadow-2xl active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:scale-100"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">מייצר ערוץ מאובטח <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></span>
            ) : (
              <span className="flex items-center gap-2">כניסה לצ'אט <ChevronLeft size={20} /></span>
            )}
          </button>
        </form>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400 font-bold flex items-center justify-center gap-1">
            <HardHat size={12} /> מחובר למוח המלאי והייעוץ הטכני
          </p>
        </div>
      </div>
    </div>
  );
}
