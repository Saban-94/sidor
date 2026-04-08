'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Menu, X, Bell, User, Settings, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';

const OrderBoard = dynamic(() => import('../components/OrderBoard'), { ssr: false });
const SmartOrderSync = dynamic(() => import('../components/SmartOrderSync'), { ssr: false });

export default function SabanConsole() {
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <Layout>
      <Head>
        <title>SabanOS | Professional</title>
      </Head>

      <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <Menu size={24} className="text-slate-600" />
            </button>
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Saban OS</p>
              <h1 className="text-lg font-black italic tracking-tighter">Console.v2</h1>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-200">RM</div>
        </header>

        {/* Side Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-10">
                  <span className="font-black italic text-xl text-blue-600">MENU</span>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-50 rounded-lg text-slate-400"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                  {[ {icon: User, label: 'פרופיל'}, {icon: Bell, label: 'התראות'}, {icon: Settings, label: 'הגדרות'} ].map((item, i) => (
                    <button key={i} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                      <div className="flex items-center gap-3"><item.icon size={20}/>{item.label}</div>
                      <ChevronRight size={16}/>
                    </button>
                  ))}
                  <button className="w-full flex items-center gap-3 p-4 text-red-500 font-bold"><LogOut size={20}/> התנתק</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="p-4 pb-40">
           <OrderBoard />
        </main>

        {/* מחובר ל-Shipping Brain החדש */}
        <SmartOrderSync />
      </div>
    </Layout>
  );
}
