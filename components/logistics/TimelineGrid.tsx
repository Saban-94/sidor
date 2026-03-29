'use client';

import { TimeSlot } from '@/types';
import { OrderCard } from './OrderCard';

interface TimelineGridProps {
  slots: TimeSlot[];
  onEditOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const TimelineGrid = ({
  slots,
  onEditOrder,
  onDeleteOrder,
}: TimelineGridProps) => {
  return (
    <div className="space-y-2">
      {slots.map((slot) => (
        <div
          key={slot.time}
          className="border border-white/10 rounded-lg overflow-hidden hover:border-saban-emerald/30 transition-colors"
        >
          {/* Time Header */}
          <div className="bg-gradient-to-r from-saban-surface/50 to-transparent px-4 py-3 border-b border-white/5">
            <div className="font-mono text-sm font-semibold text-saban-emerald">
              {slot.time}
            </div>
          </div>

          {/* Orders Container */}
          <div className="p-4 space-y-2">
            {slot.isEmpty ? (
              <div className="text-center py-6 text-saban-muted text-sm">
                אין הזמנות בזמן זה
              </div>
            ) : (
              slot.orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onEdit={onEditOrder}
                  onDelete={onDeleteOrder}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
