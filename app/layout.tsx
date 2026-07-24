import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin';
import { extractRouterConfig } from 'uploadthing/server';
import './globals.css';
import { CartProvider } from '@/lib/cart-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { ourFileRouter } from '@/app/api/uploadthing/core';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-roboto-mono' });

export const metadata: Metadata = {
  title: 'Nakhyatra — Steel Posters & Phone Cases',
  description: 'Original art on steel prints and phone cases. Made to last.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans bg-bg text-ink">
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <CartProvider>
          <Header />
          {children}
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
