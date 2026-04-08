'use client';
import React, { useState } from 'react';
import { UserPlus, Link as LinkIcon, Copy, Check } from 'lucide-react';

export default function CustomerMagicLink() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);

  const generateLink = () => {
    // מנקה את המספר לפורמט בינלאומי נקי
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? '972' + cleanPhone.substring(1) : cleanPhone;
    return `https://sidor.vercel.app/chat2/${finalPhone}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 glass-effect-strong rounded-3xl border border-white/10 max-w-md mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <UserPlus className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-bold text-white">מחולל לינק קסם ללקוח</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">שם הלקוח / העסק</label>
          <input 
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
            placeholder="למשל: אבי לוי - שיפוצים"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">מספר נייד</label>
          <input 
            type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500"
            placeholder="050-8860123"
          />
        </div>

        {phone.length >= 9 && (
          <div className="mt-6 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <p className="text-[10px] text-emerald-500 font-bold mb-2 uppercase">הלינק האישי של {name || 'הלקוח'}:</p>
            <div className="flex items-center justify-between gap-2 bg-black/20 p-2 rounded-lg">
              <code className="text-[10px] text-slate-300 truncate">{generateLink()}</code>
              <button onClick={copyToClipboard} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
