import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIP-ANGGARAN – Sistem Informasi Pembahasan Usulan Pagu, Hibah & Bansos',
  description: 'Platform collaborative budgeting desk terintegrasi untuk Tim Anggaran Pemerintah Daerah (TAPD), Bappeda, dan Perangkat Daerah (OPD) dalam pembahasan usulan pagu, hibah, dan bansos.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
