'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutDashboard, Package, History, Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface SideNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideNavigation({ isOpen, onClose }: SideNavigationProps) {
  const { theme, toggleTheme, language, setLanguage } = useTheme();

  const menuItems = [
    { icon: LayoutDashboard, label: language === 'he' ? 'לוח בקרה' : 'Dashboard', href: '#dashboard' },
    { icon: Package, label: language === 'he' ? 'מלאי' : 'Inventory', href: '#inventory' },
    { icon: History, label: language === 'he' ? 'היסטוריית הזמנות' : 'Order History', href: '#history' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: language === 'he' ? 300 : -300 }}
            animate={{ x: 0 }}
            exit={{ x: language === 'he' ? 300 : -300 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`fixed top-0 ${language === 'he' ? 'right-0' : 'left-0'} h-screen w-64 glass-effect-strong z-50 flex flex-col`}
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="font-bold text-lg text-[var(--color-text-primary)]">
                {language === 'he' ? 'תפריט' : 'Menu'}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 hover:bg-[var(--color-surface)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--color-text-primary)]" />
              </motion.button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.a
                    key={item.href}
                    initial={{ opacity: 0, x: language === 'he' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-primary)] group"
                  >
                    <Icon className="w-5 h-5 text-[var(--color-primary)] group-hover:text-[var(--color-primary-light)]" />
                    <span className="font-medium">{item.label}</span>
                  </motion.a>
                );
              })}
            </nav>

            {/* Settings Section */}
            <div className="border-t border-[var(--color-border)] p-4 space-y-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-[var(--color-primary)]" />
                  ) : (
                    <Sun className="w-5 h-5 text-[var(--color-primary)]" />
                  )}
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {theme === 'dark' ? (language === 'he' ? 'מצב בהיר' : 'Light') : (language === 'he' ? 'מצב אפל' : 'Dark')}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                  className="w-5 h-5"
                >
                  {theme === 'dark' ? '🌙' : '☀️'}
                </motion.div>
              </button>

              {/* Language Toggle */}
              <button
                onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[var(--color-primary)]" />
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {language === 'he' ? 'English' : 'עברית'}
                  </span>
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {language === 'he' ? 'EN' : 'HE'}
                </span>
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-tertiary)]">
              <p>SabanOS v1.0</p>
              <p>{language === 'he' ? 'ניהול חומרי בנייה' : 'Building Materials Management'}</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
