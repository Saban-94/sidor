import { DispatchOrder, TimeSlot } from '@/types';

/**
 * Generate time slots for the day (30-minute intervals from 06:00 to 17:00)
 */
export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  let hour = 6;
  let minute = 0;

  while (hour < 17 || (hour === 17 && minute === 0)) {
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    slots.push(timeStr);

    minute += 30;
    if (minute === 60) {
      minute = 0;
      hour += 1;
    }
  }

  return slots;
};

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Find the closest time slot for a given time
 */
export const findClosestTimeSlot = (time: string): string => {
  const slots = generateTimeSlots();
  const orderMinutes = timeToMinutes(time);

  let closest = slots[0];
  let minDiff = Math.abs(timeToMinutes(slots[0]) - orderMinutes);

  for (const slot of slots) {
    const slotMinutes = timeToMinutes(slot);
    const diff = Math.abs(slotMinutes - orderMinutes);

    if (diff < minDiff) {
      minDiff = diff;
      closest = slot;
    }
  }

  return closest;
};

/**
 * Group orders by time slot
 */
export const groupOrdersByTimeSlot = (orders: DispatchOrder[]): TimeSlot[] => {
  const slots = generateTimeSlots();
  const timeSlots: TimeSlot[] = slots.map(time => ({
    time,
    orders: [],
    isEmpty: true,
  }));

  for (const order of orders) {
    const slot = findClosestTimeSlot(order.order_time);
    const slotIndex = timeSlots.findIndex(ts => ts.time === slot);
    if (slotIndex !== -1) {
      timeSlots[slotIndex].orders.push(order);
      timeSlots[slotIndex].isEmpty = false;
    }
  }

  return timeSlots;
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') return date;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
  return formatDate(new Date());
};

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
};

/**
 * Check if an order is for today
 */
export const isOrderToday = (order: DispatchOrder): boolean => {
  return order.order_date === getTodayDate();
};

/**
 * Check if an order is for tomorrow
 */
export const isOrderTomorrow = (order: DispatchOrder): boolean => {
  return order.order_date === getTomorrowDate();
};

/**
 * Calculate delivery statistics
 */
export const calculateStats = (orders: DispatchOrder[]) => {
  const total = orders.length;
  const delivered = orders.filter(o => o.status === 'delivered').length;
  const pending = orders.filter(o => o.status === 'pending' || o.status === 'assigned').length;

  return {
    totalOrders: total,
    deliveredToday: delivered,
    pendingOrders: pending,
    completionRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
  };
};
