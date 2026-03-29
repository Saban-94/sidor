'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '../../lib/supabase';
import { LogisticsDashboard } from '../../components/logistics/LogisticsDashboard';
import { DispatchOrder } from '@/types';

export default function LogisticsControl() {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  // Fetch orders from Supabase
  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('saban_dispatch')
        .select('*')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('[v0] Error fetching orders:', error.message);
        setLoading(false);
        return;
      }

      // Map Supabase columns to our DispatchOrder interface
      const mappedOrders: DispatchOrder[] = (data || []).map(item => ({
        id: item.id,
        customer_name: item.customer_name || '',
        phone: item.phone || '',
        delivery_address: item.delivery_address || item.address || '',
        order_time: item.scheduled_time || '',
        order_date: item.scheduled_date || '',
        items: item.items || undefined,
        notes: item.notes || undefined,
        status: item.status || 'pending',
        assigned_driver: item.assigned_driver || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setOrders(mappedOrders);
    } catch (error) {
      console.error('[v0] Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Set up real-time subscriptions
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('logistics_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saban_dispatch' },
        () => {
          console.log('[v0] Database change detected, refreshing orders');
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, supabase]);

  const handleAddOrder = async (
    order: Omit<DispatchOrder, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('saban_dispatch')
        .insert([
          {
            customer_name: order.customer_name,
            phone: order.phone,
            delivery_address: order.delivery_address,
            scheduled_time: order.order_time,
            scheduled_date: order.order_date,
            items: order.items || null,
            notes: order.notes || null,
            status: order.status,
          },
        ])
        .select();

      if (error) {
        console.error('[v0] Error adding order:', error.message);
        return;
      }

      console.log('[v0] Order added successfully:', data);
      fetchOrders();
    } catch (error) {
      console.error('[v0] Unexpected error adding order:', error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('saban_dispatch')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('[v0] Error deleting order:', error.message);
        return;
      }

      console.log('[v0] Order deleted successfully');
      fetchOrders();
    } catch (error) {
      console.error('[v0] Unexpected error deleting order:', error);
    }
  };

  const handleEditOrder = async (order: DispatchOrder) => {
    try {
      const { error } = await supabase
        .from('saban_dispatch')
        .update({
          customer_name: order.customer_name,
          phone: order.phone,
          delivery_address: order.delivery_address,
          scheduled_time: order.order_time,
          scheduled_date: order.order_date,
          items: order.items || null,
          notes: order.notes || null,
          status: order.status,
        })
        .eq('id', order.id);

      if (error) {
        console.error('[v0] Error updating order:', error.message);
        return;
      }

      console.log('[v0] Order updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('[v0] Unexpected error updating order:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saban-dark via-saban-surface to-saban-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-saban-emerald/30 border-t-saban-emerald animate-spin mb-4" />
          <p className="text-saban-muted">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <LogisticsDashboard
      ordersData={orders}
      onAddOrder={handleAddOrder}
      onDeleteOrder={handleDeleteOrder}
      onEditOrder={handleEditOrder}
    />
  );
}
