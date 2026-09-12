import type { Metadata, Viewport } from 'next';
import { Noto_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { SplashScreen } from '@/components/ui/SplashScreen';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SmartCare | Care access, simplified',
    template: '%s | SmartCare',
  },
  description:
    'Digital queue access for patients, hospitals, and care teams. Find nearby care, reserve your place, and track your appointment in one clear flow.',
  keywords: ['healthcare', 'hospital queue', 'patient booking', 'medical appointment', 'SmartCare'],
  authors: [{ name: 'SmartCare Systems' }],
  metadataBase: new URL('https://mohammed-ashraf-shaik.github.io/smart-care-app'),
  openGraph: {
    type: 'website',
    siteName: 'SmartCare',
    title: 'SmartCare | Care access, simplified',
    description: 'Digital queue access for patients, hospitals, and care teams.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f5ca8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('smartcare.theme');
                if (t === 'dark') {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.classList.remove('dark');
                }
                var fs = parseInt(localStorage.getItem('smartcare.fontScale') || '0', 10);
                var fsMap = {'-2':'13px','-1':'14px','0':'16px','1':'18px','2':'20px'};
                document.documentElement.style.setProperty('--font-base', fsMap[String(fs)] || '16px');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${notoSans.variable} font-sans antialiased`}>
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
