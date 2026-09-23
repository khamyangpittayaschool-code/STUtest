import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navigation/Navbar';

export const metadata: Metadata = {
  title: 'ระบบบริหารจัดการกิจกรรมอบรม AI | AI Training Management & Gamification',
  description: 'Production-ready AI Training Management, Gamification & Assignment System สำหรับโรงเรียน',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            ระบบบริหารจัดการกิจกรรมอบรมการประยุกต์ใช้เทคโนโลยีปัญญาประดิษฐ์ (AI Training Hub) • 2569
          </div>
        </footer>
      </body>
    </html>
  );
}
