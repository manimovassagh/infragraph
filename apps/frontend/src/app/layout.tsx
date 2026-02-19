import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AWSArchitect',
  description: 'Visualize AWS infrastructure as interactive architecture diagrams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-navy-900 text-slate-200 antialiased">{children}</body>
    </html>
  );
}
