import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import './globals.css';

export const metadata: Metadata = {
  title: 'VendorBridge | Procurement & Vendor Management ERP',
  description: 'Centralized procurement, vendor quotation tracking, and purchase order workflow automation platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="animate-fade-in">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
