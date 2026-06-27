import type { Metadata, Viewport } from 'next';
import { Inter, Cairo, Fraunces } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/components/i18n-provider';
import { TourProvider } from '@/components/tour-provider';
import { getServerLocale } from '@/lib/locale-server';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });

export const metadata: Metadata = {
  title: 'NAHJ Dashboard — جمعية نهج لتمكين الشباب',
  description: 'Strategy, KPI, risk and program dashboard for NAHJ Youth Empowerment Society',
};

// Explicit viewport so the dark theme extends into the mobile browser chrome
// and pinch-zoom stays available for accessibility.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A1628',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getServerLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${cairo.variable} ${fraunces.variable}`}>
      <body>
        <I18nProvider initialLocale={locale}>
          <TourProvider>{children}</TourProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
