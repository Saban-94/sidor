'use client';

import { useState } from 'react';
import { DispatchOrder } from '@/types';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManualOrderWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: Omit<DispatchOrder, 'id' | 'created_at' | 'updated_at'>) => void;
}

type Step = 'customer' | 'delivery' | 'review';

interface FormData {
  customer_name: string;
  phone: string;
  delivery_address: string;
  order_time: string;
  order_date: string;
  items?: string;
  notes?: string;
}

const initialFormData: FormData = {
  customer_name: '',
  phone: '',
  delivery_address: '',
  order_time: '',
  order_date: new Date().toISOString().split('T')[0],
  items: '',
  notes: '',
};

export const ManualOrderWizard = ({
  isOpen,
  onClose,
  onSubmit,
}: ManualOrderWizardProps) => {
  const [step, setStep] = useState<Step>('customer');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep = (currentStep: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'customer') {
      if (!formData.customer_name.trim())
        newErrors.customer_name = 'שם הלקוח נדרש';
      if (!formData.phone.trim()) newErrors.phone = 'מספר טלפון נדרש';
      if (!/^\d{9,10}$/.test(formData.phone.replace(/\D/g, '')))
        newErrors.phone = 'מספר טלפון לא תקין';
    }

    if (currentStep === 'delivery') {
      if (!formData.delivery_address.trim())
        newErrors.delivery_address = 'כתובת החלקה נדרשת';
      if (!formData.order_time) newErrors.order_time = 'זמן הזמנה נדרש';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    const stepSequence: Step[] = ['customer', 'delivery', 'review'];
    const nextIndex = stepSequence.indexOf(step) + 1;
    if (nextIndex < stepSequence.length) {
      setStep(stepSequence[nextIndex]);
    }
  };

  const handlePrevious = () => {
    const stepSequence: Step[] = ['customer', 'delivery', 'review'];
    const prevIndex = stepSequence.indexOf(step) - 1;
    if (prevIndex >= 0) {
      setStep(stepSequence[prevIndex]);
    }
  };

  const handleSubmit = () => {
    if (validateStep(step)) {
      onSubmit({
        ...formData,
        status: 'pending',
      });
      setFormData(initialFormData);
      setStep('customer');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-saban-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-saban-surface/80 to-saban-emerald/10 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">הזמנה חדשה</h2>
            <p className="text-xs text-saban-muted mt-1">
              {step === 'customer' && 'פרטי הלקוח'}
              {step === 'delivery' && 'פרטי החלקה'}
              {step === 'review' && 'סקירה וביצוע'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <AnimatePresence mode="wait">
            {/* Customer Step */}
            {step === 'customer' && (
              <motion.div
                key="customer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    שם הלקוח
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    placeholder="הכנס שם לקוח"
                    className="w-full px-4 py-2 bg-saban-dark/50 border border-white/20 rounded-lg text-white placeholder-saban-muted focus:outline-none focus:border-saban-emerald transition-colors"
                  />
                  {errors.customer_name && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.customer_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    מספר טלפון
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="05xxxxxxxxx"
                    className="w-full px-4 py-2 bg-saban-dark/50 border border-white/20 rounded-lg text-white placeholder-saban-muted focus:outline-none focus:border-saban-emerald transition-colors"
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Delivery Step */}
            {step === 'delivery' && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    כתובת החלקה
                  </label>
                  <textarea
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleInputChange}
                    placeholder="הכנס כתובת מלאה"
                    rows={3}
                    className="w-full px-4 py-2 bg-saban-dark/50 border border-white/20 rounded-lg text-white placeholder-saban-muted focus:outline-none focus:border-saban-emerald transition-colors resize-none"
                  />
                  {errors.delivery_address && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.delivery_address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      תאריך
                    </label>
                    <input
                      type="date"
                      name="order_date"
                      value={formData.order_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-saban-dark/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-saban-emerald transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      זמן
                    </label>
                    <input
                      type="time"
                      name="order_time"
                      value={formData.order_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-saban-dark/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-saban-emerald transition-colors"
                    />
                    {errors.order_time && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.order_time}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    פריטים (אופציונלי)
                  </label>
                  <input
                    type="text"
                    name="items"
                    value={formData.items}
                    onChange={handleInputChange}
                    placeholder="תיאור הפריטים"
                    className="w-full px-4 py-2 bg-saban-dark/50 border border-white/20 rounded-lg text-white placeholder-saban-muted focus:outline-none focus:border-saban-emerald transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {/* Review Step */}
            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-saban-dark/50 border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-saban-muted mb-1">שם לקוח</p>
                      <p className="text-white font-medium">
                        {formData.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-saban-muted mb-1">טלפון</p>
                      <p className="text-white font-medium">{formData.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-saban-muted mb-1">כתובת</p>
                      <p className="text-white font-medium">
                        {formData.delivery_address}
                      </p>
                    </div>
                    <div>
                      <p className="text-saban-muted mb-1">תאריך</p>
                      <p className="text-white font-medium">
                        {formData.order_date}
                      </p>
                    </div>
                    <div>
                      <p className="text-saban-muted mb-1">זמן</p>
                      <p className="text-white font-medium">
                        {formData.order_time}
                      </p>
                    </div>
                    {formData.items && (
                      <div className="col-span-2">
                        <p className="text-saban-muted mb-1">פריטים</p>
                        <p className="text-white font-medium">{formData.items}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    הערות (אופציונלי)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="הערות נוספות לצוות"
                    rows={2}
                    className="w-full px-4 py-2 bg-saban-dark/50 border border-white/20 rounded-lg text-white placeholder-saban-muted focus:outline-none focus:border-saban-emerald transition-colors resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with Navigation */}
        <div className="bg-gradient-to-r from-saban-surface/50 to-transparent border-t border-white/10 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={step === 'customer'}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors text-sm"
          >
            <ChevronLeft size={16} />
            חזור
          </button>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                step === 'customer' ? 'bg-saban-emerald' : 'bg-white/20'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                step === 'delivery' ? 'bg-saban-emerald' : 'bg-white/20'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                step === 'review' ? 'bg-saban-emerald' : 'bg-white/20'
              }`}
            />
          </div>

          <button
            onClick={step === 'review' ? handleSubmit : handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-saban-emerald hover:bg-saban-emerald/90 rounded-lg text-saban-dark font-medium transition-colors text-sm"
          >
            {step === 'review' ? 'שמור הזמנה' : 'הבא'}
            {step !== 'review' && <ChevronRight size={16} />}
          </button>
        </div>
      </motion.div>
    </>
  );
};
