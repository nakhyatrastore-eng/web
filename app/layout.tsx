import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Outfit } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { CartProvider } from '@/lib/cart-context';
import AnnouncementBar from '@/components/AnnouncementBar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import MotionLayer from '@/components/MotionLayer';
import { ShoppingAssistantProvider } from '@/components/ShoppingAssistant';
import MaintenanceGate from '@/components/MaintenanceGate';

const fontOutfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});
const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nakhyatra.store';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Nakhyatra | Phone Cases & Metal Wall Prints',
    template: '%s | Nakhyatra',
  },
  description:
    'Shop bold phone cases for your exact model and curated metal wall prints for your space, fulfilled with trusted production partners.',
  applicationName: 'Nakhyatra',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: "Nakhyatra | Designs that don't blend in",
    description:
      'Phone cases for your exact model and metal wall prints for your space.',
    url: '/',
    siteName: 'Nakhyatra',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/og-small-drop.png', width: 1744, height: 909, alt: 'Nakhyatra The Small Drop — five pieces, one swipe away' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Nakhyatra | Designs that don't blend in",
    description: 'Phone cases for your exact model and metal wall prints for your space.',
    images: ['/og-small-drop.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050505',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const storeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${siteUrl}/#store`,
    name: 'Nakhyatra',
    legalName: 'Nakhyatra Store',
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    email: 'nakhyatrastore@gmail.com',
    telephone: '+91 93953 34322',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer care and grievance support',
      telephone: '+91 93953 34322',
      email: 'nakhyatrastore@gmail.com',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Nakhyatra Office, Flat No. 1, Bongara',
      addressLocality: 'Guwahati',
      addressRegion: 'Assam',
      postalCode: '781015',
      addressCountry: 'IN',
    },
    sameAs: ['https://www.instagram.com/nakhyatra.store'],
  };

  return (
    <html
      lang="en-IN"
      data-scroll-behavior="smooth"
      className={`${fontOutfit.variable} ${fontMono.variable}`}
    >
      <body className="bg-bg font-sans text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(storeJsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <CartProvider>
          <ShoppingAssistantProvider>
            <MaintenanceGate>
              <div className="standard-store-header">
                <AnnouncementBar />
                <Header />
              </div>
              {children}
              <div className="standard-store-footer"><Footer /></div>
              <CartDrawer />
              <div className="standard-store-mobile-nav"><MobileNav /></div>
              <MotionLayer />
            </MaintenanceGate>
            <Analytics />
          </ShoppingAssistantProvider>
        </CartProvider>
      </body>
    </html>
  );
}
