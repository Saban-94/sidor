'use client';

import React, { useState, useEffect } from 'react';
import { CustomerIdentity } from '@/types';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';

interface CustomerListProps {
  selectedCustomerId?: string;
  onSelectCustomer: (customer: CustomerIdentity) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ selectedCustomerId, onSelectCustomer }) => {
  const [customers, setCustomers] = useState<CustomerIdentity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }

    const customersRef = ref(database, 'customers');
    const unsubscribe = onValue(customersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, cust]: [string, any]) => ({
          id,
          ...cust,
        }));
        setCustomers(list);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-black">טוען לקוחות...</div>;

  return (
    <div className="h-full flex flex-col bg-[#0f172a]">
      <div className="p-6 border-b border-white/5">
        <h3 className="text-white font-black uppercase tracking-widest text-xs">רשימת לקוחות פעילים</h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {customers.map((customer) => (
          <button
            key={customer.id}
            onClick={() => onSelectCustomer(customer)}
            className={`w-full p-4 flex items-center gap-4 transition-all border-b border-white/5 ${
              selectedCustomerId === customer.id ? 'bg-brand/10 border-l-4 border-l-brand' : 'hover:bg-white/5'
            }`}
          >
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold uppercase">
              {customer.name?.charAt(0)}
            </div>
            <div className="text-right">
              <p className="text-white font-bold">{customer.name}</p>
              <p className="text-xs text-slate-500">{customer.phone}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
