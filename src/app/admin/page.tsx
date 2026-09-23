'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/teacher');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-slate-500 text-sm">
      กำลังนำทางไปที่แดชบอร์ดครูผู้สอน...
    </div>
  );
}
