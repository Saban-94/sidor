// pages/[...page].tsx
import { BuilderComponent, builder } from '@builder.io/sdk';
import React from 'react';
import AppLayout from '../components/Layout';

// וודא שהמפתח נמצא ב-Vercel Environment Variables
builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY!);

interface PageProps {
  page: any;
}

export async function getStaticProps({ params }: { params: { page: string[] } }) {
  // שליפת התוכן מ-Builder לפי הנתיב
  const page = await builder
    .get('page', {
      userAttributes: {
        urlPath: '/' + (params?.page?.join('/') || ''),
      },
    })
    .toPromise();

  return {
    props: {
      page: page || null,
    },
    // מאפשר עדכון התוכן ללא Build מחדש כל 5 שניות
    revalidate: 5,
  };
}

export async function getStaticPaths() {
  // מקבל את כל הדפים שנוצרו ב-Builder כדי ש-Next יכיר אותם
  const pages = await builder.getAll('page', {
    fields: 'data.url',
    options: { noTargeting: true },
  });

  return {
    paths: pages.map((page) => `${page.data?.url}`),
    fallback: 'blocking',
  };
}

export default function MyPage({ page }: PageProps) {
  return (
    <AppLayout>
      {page ? (
        <BuilderComponent model="page" content={page} />
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <p>הדף לא נמצא ב-Builder.io</p>
        </div>
      )}
    </AppLayout>
  );
}
