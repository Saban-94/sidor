'use client';

import { useEffect, useState } from 'react';
import { DispatchOrder, TimeSlot } from '@/types';
import { DigitalClock } from './DigitalClock';
import { DriverTimeline } from './DriverTimeline';
import { OrderCard } from './OrderCard';
import { ManualOrderWizard } from './ManualOrderWizard';
import {
  generateTimeSlots,
  groupOrdersByTimeSlot,
  getTodayDate,
  getTomorrowDate,
  calculateStats,
} from '@/lib/logistics';
import { Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogisticsDashboardProps {
  ordersData?: DispatchOrder[];
  onAddOrder?: (order: Omit<DispatchOrder, 'id' | 'created_at' | 'updated_at'>) => void;
  onDeleteOrder?: (orderId: string) => void;
  onEditOrder?: (order: DispatchOrder) => void;
}

export const LogisticsDashboard = ({
  ordersData = [],
  onAddOrder,
  onDeleteOrder,
  onEditOrder,
}: LogisticsDashboardProps) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [todayOrders, setTodayOrders] = useState<DispatchOrder[]>([]);
  const [tomorrowOrders, setTomorrowOrders] = useState<DispatchOrder[]>([]);
  const [todaySlots, setTodaySlots] = useState<TimeSlot[]>([]);
  const [tomorrowSlots, setTomorrowSlots] = useState<TimeSlot[]>([]);

  // Process orders data
  useEffect(() => {
    const today = getTodayDate();
    const tomorrow = getTomorrowDate();

    const filteredToday = ordersData.filter(o => o.order_date === today);
    const filteredTomorrow = ordersData.filter(o => o.order_date === tomorrow);

    setTodayOrders(filteredToday);
    setTomorrowOrders(filteredTomorrow);
    setTodaySlots(groupOrdersByTimeSlot(filteredToday));
    setTomorrowSlots(groupOrdersByTimeSlot(filteredTomorrow));
  }, [ordersData]);

  const todayStats = calculateStats(todayOrders);
  const tomorrowStats = calculateStats(tomorrowOrders);

  const handleAddOrder = (order: Omit<DispatchOrder, 'id' | 'created_at' | 'updated_at'>) => {
    if (onAddOrder) {
      onAddOrder(order);
    }
  };

  const handleEditOrder = (orderId: string) => {
    const order = [...todayOrders, ...tomorrowOrders].find(o => o.id === orderId);
    if (order && onEditOrder) {
      onEditOrder(order);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (onDeleteOrder) {
      onDeleteOrder(orderId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saban-dark via-saban-surface to-saban-dark text-white p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              מערכת לוגיסטיקה סבן
            </h1>
            <p className="text-saban-muted">בקרה בזמן אמת על הזמנות והנהגים</p>
          </div>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-saban-emerald hover:bg-saban-emerald/90 text-saban-dark font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-saban-emerald/30"
          >
            <Plus size={20} />
            הזמנה חדשה
          </button>
        </div>

        {/* Clock */}
        <DigitalClock />
      </motion.div>

      {/* Main Grid - Today and Tomorrow */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Today's Timeline - 2 columns wide */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="bg-saban-surface/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">היום</h2>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <p className="text-saban-muted">סה״כ הזמנות</p>
                  <p className="text-lg font-semibold text-white">
                    {todayStats.totalOrders}
                  </p>
                </div>
                <div>
                  <p className="text-saban-muted">הוכנסו</p>
                  <p className="text-lg font-semibold text-saban-emerald">
                    {todayStats.deliveredToday}
                  </p>
                </div>
                <div>
                  <p className="text-saban-muted">ממתינות</p>
                  <p className="text-lg font-semibold text-amber-400">
                    {todayStats.pendingOrders}
                  </p>
                </div>
              </div>
            </div>

            {todaySlots.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-saban-emerald/30">
                {todaySlots.map(slot => (
                  <motion.div
                    key={slot.time}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-white/10 rounded-lg overflow-hidden hover:border-saban-emerald/30 transition-colors"
                  >
                    <div className="bg-gradient-to-r from-saban-surface/50 to-transparent px-4 py-2 border-b border-white/5">
                      <div className="font-mono text-sm font-semibold text-saban-emerald">
                        {slot.time}
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      {slot.isEmpty ? (
                        <div className="text-center py-3 text-saban-muted text-xs">
                          אין הזמנות
                        </div>
                      ) : (
                        slot.orders.map(order => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            onEdit={handleEditOrder}
                            onDelete={handleDeleteOrder}
                          />
                        ))
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-saban-muted">
                אין הזמנות ליום הזה
              </div>
            )}
          </div>
        </motion.div>

        {/* Tomorrow's Orders - 1 column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-saban-surface/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm h-full">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">מחר</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-saban-muted">הזמנות</span>
                  <span className="font-semibold text-white">
                    {tomorrowStats.totalOrders}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-saban-muted">הוכנסו</span>
                  <span className="font-semibold text-saban-emerald">
                    {tomorrowStats.deliveredToday}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-saban-muted">ממתינות</span>
                  <span className="font-semibold text-amber-400">
                    {tomorrowStats.pendingOrders}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-saban-emerald/30">
              {tomorrowSlots.length > 0 ? (
                tomorrowSlots
                  .filter(slot => !slot.isEmpty)
                  .map(slot => (
                    <motion.div
                      key={slot.time}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="text-xs font-mono text-saban-muted mb-1">
                        {slot.time}
                      </div>
                      {slot.orders.map(order => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onEdit={onEditOrder}
                          onDelete={onDeleteOrder}
                        />
                      ))}
                    </motion.div>
                  ))
              ) : (
                <div className="text-center py-12 text-saban-muted text-xs">
                  אין הזמנות
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Manual Order Wizard Modal */}
      <ManualOrderWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmit={handleAddOrder}
      />
    </div>
  );
};
