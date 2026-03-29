'use client';

import { DispatchOrder } from '@/types';
import { Trash2, Edit2, MapPin, Phone, Package } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface OrderCardProps {
  order: DispatchOrder;
  onEdit?: (orderId: string) => void;
  onDelete?: (orderId: string) => void;
}

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_transit: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered: 'bg-saban-emerald/20 text-saban-emerald border-saban-emerald/30',
};

const statusLabels = {
  pending: 'ממתין',
  assigned: 'הוקצה',
  in_transit: 'בדרך',
  delivered: 'הוכנס',
};

export const OrderCard = ({ order, onEdit, onDelete }: OrderCardProps) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative bg-gradient-to-br from-saban-surface/60 to-saban-surface/20 border border-white/10 rounded-lg p-4 hover:border-saban-emerald/50 transition-all duration-300 group"
    >
      {/* Background glow on hover */}
      {isHovering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-saban-emerald/5 rounded-lg pointer-events-none"
        />
      )}

      <div className="relative z-10 space-y-3">
        {/* Header with customer name and status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate text-sm">
              {order.customer_name}
            </h3>
          </div>
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${
              statusColors[order.status as keyof typeof statusColors]
            }`}
          >
            {statusLabels[order.status as keyof typeof statusLabels]}
          </span>
        </div>

        {/* Contact and address */}
        <div className="space-y-2 text-xs text-saban-muted">
          <div className="flex items-center gap-2">
            <Phone size={14} className="flex-shrink-0" />
            <a
              href={`tel:${order.phone}`}
              className="hover:text-saban-emerald transition-colors"
            >
              {order.phone}
            </a>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={14} className="flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{order.delivery_address}</span>
          </div>
        </div>

        {/* Items if available */}
        {order.items && (
          <div className="flex items-start gap-2 text-xs text-saban-muted">
            <Package size={14} className="flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{order.items}</span>
          </div>
        )}

        {/* Notes if available */}
        {order.notes && (
          <div className="text-xs text-saban-muted italic border-l-2 border-saban-emerald/30 pl-2">
            {order.notes}
          </div>
        )}
      </div>

      {/* Action buttons - visible on hover */}
      {isHovering && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-2 right-2 flex gap-1"
        >
          {onEdit && (
            <button
              onClick={() => onEdit(order.id)}
              className="p-2 rounded bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 transition-colors"
              title="Edit order"
            >
              <Edit2 size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(order.id)}
              className="p-2 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
              title="Delete order"
            >
              <Trash2 size={16} />
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
