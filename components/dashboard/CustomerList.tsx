'use client';

import React, { useState, useEffect } from 'react';
import { CustomerIdentity } from '@/types';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';

interface CustomerListProps {
  onSelectCustomer: (customer: CustomerIdentity) => void;
  selectedCustomerId?: string;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onSelectCustomer,
  selectedCustomerId,
}) => {
  const [customers, setCustomers] = useState<CustomerIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    try {
      const customersRef = ref(database, 'customers');
      const customersQuery = query(customersRef, limitToLast(100));

      const unsubscribe = onValue(
        customersQuery,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const customerList = Object.entries(data).map(([id, value]: [string, any]) => ({
              id,
              ...value,
            })) as CustomerIdentity[];

            // Sort by last active
            customerList.sort((a, b) => b.lastActive - a.lastActive);
            setCustomers(customerList);
          }
          setLoading(false);
        },
        (error) => {
          console.error('[v0] Error loading customers:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('[v0] Failed to setup customer listener:', error);
      setLoading(false);
    }
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
  );

  const getStatusColor = (lastActive: number) => {
    const now = Date.now();
    const diffMinutes = (now - lastActive) / (1000 * 60);
    if (diffMinutes < 5) return 'bg-saban-emerald';
    if (diffMinutes < 60) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="h-full flex flex-col bg-saban-slate border-r border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white mb-3">Customers</h2>
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="w-full px-3 py-2 bg-saban-dark border border-white/20 rounded text-white text-sm placeholder-saban-muted focus:border-saban-emerald transition"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Customers List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-saban-muted">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-saban-muted text-sm">
            No customers found
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => onSelectCustomer(customer)}
                className={`w-full px-3 py-3 rounded-lg text-left transition flex items-center gap-3 ${
                  selectedCustomerId === customer.id
                    ? 'bg-saban-emerald/20 border border-saban-emerald'
                    : 'hover:bg-saban-dark/50 border border-transparent'
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-saban-blue/20 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {customer.profilePicture ? (
                      <img
                        src={customer.profilePicture}
                        alt={customer.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      customer.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${getStatusColor(
                      customer.lastActive
                    )} border border-saban-slate`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{customer.name}</p>
                  <p className="text-saban-muted text-xs truncate">{customer.phone}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
