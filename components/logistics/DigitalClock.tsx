'use client';

import { useEffect, useState } from 'react';

export const DigitalClock = () => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Set initial time
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center">
      <div className="bg-gradient-to-br from-saban-emerald/20 to-saban-surface/40 border border-saban-emerald/30 rounded-lg px-6 py-4 backdrop-blur-sm">
        <div className="font-mono text-4xl font-bold text-saban-emerald tracking-wider">
          {time || '00:00:00'}
        </div>
        <div className="text-xs text-saban-muted text-center mt-1 uppercase tracking-widest">
          זמן ממשי
        </div>
      </div>
    </div>
  );
};
