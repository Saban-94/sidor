'use client';

import { TimeSlot } from '@/types';
import { TimelineGrid } from './TimelineGrid';
import { User, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface DriverTimelineProps {
  driverId: string;
  driverName: string;
  slots: TimeSlot[];
  status: 'available' | 'busy' | 'offline';
  currentLocation?: string;
  onEditOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

const statusColors = {
  available: 'bg-emerald-500/20 text-emerald-400',
  busy: 'bg-amber-500/20 text-amber-400',
  offline: 'bg-gray-500/20 text-gray-400',
};

const statusLabels = {
  available: 'זמין',
  busy: 'עסוק',
  offline: 'לא מקוון',
};

export const DriverTimeline = ({
  driverId,
  driverName,
  slots,
  status,
  currentLocation,
  onEditOrder,
  onDeleteOrder,
}: DriverTimelineProps) => {
  const totalOrders = slots.reduce((sum, slot) => sum + slot.orders.length, 0);
  const deliveredOrders = slots.reduce(
    (sum, slot) =>
      sum + slot.orders.filter(o => o.status === 'delivered').length,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Driver Header */}
      <div className="bg-gradient-to-r from-saban-surface/80 to-saban-surface/40 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-saban-emerald/20 border border-saban-emerald/50 flex items-center justify-center">
                <User size={20} className="text-saban-emerald" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{driverName}</h3>
                <p className="text-xs text-saban-muted">ID: {driverId}</p>
              </div>
            </div>

            {currentLocation && (
              <div className="flex items-center gap-2 text-xs text-saban-muted mt-2">
                <MapPin size={14} />
                <span>{currentLocation}</span>
              </div>
            )}
          </div>

          {/* Status and stats */}
          <div className="text-right space-y-2">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                statusColors[status]
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current mr-2" />
              {statusLabels[status]}
            </div>
            <div className="text-xs text-saban-muted">
              <div>{totalOrders} הזמנות</div>
              <div className="text-saban-emerald">
                {deliveredOrders} הוכנסו
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="pl-4 border-l-2 border-saban-emerald/30 space-y-2">
        <TimelineGrid
          slots={slots}
          onEditOrder={onEditOrder}
          onDeleteOrder={onDeleteOrder}
        />
      </div>
    </motion.div>
  );
};
