'use client';

import React from 'react';
import Head from 'next/head';
import { Dashboard } from '@/components/dashboard/Dashboard';

export default function Home() {
  return (
    <>
      <Head>
        <title>SABAN HUB | AI Customer Management</title>
        <meta name="description" content="SABAN HUB - Unified AI customer management and WhatsApp messaging platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Dashboard />
    </>
  );
}
