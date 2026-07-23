import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BrandingSyncer from "@/components/BrandingSyncer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thinkcone for Study abroad CRM",
  description: "Next-gen CRM for education and migration consultancies in Nepal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedFavicon = localStorage.getItem('organization_favicon_url');
                if (savedFavicon) {
                  let link = document.querySelector("link[rel*='icon']");
                  if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                  }
                  link.href = savedFavicon;
                }
                const savedTitle = localStorage.getItem('organization_title_tag');
                if (savedTitle) {
                  document.title = savedTitle;
                }

                const savedTheme = localStorage.getItem('organization_theme_palette') || 'light-executive';
                document.documentElement.setAttribute('data-theme', savedTheme);
                const builtInLightThemes = ['light-executive', 'light-sage', 'light-clean'];
                let isLight = builtInLightThemes.indexOf(savedTheme) !== -1;

                if (savedTheme === 'custom') {
                  const rawCustom = localStorage.getItem('organization_custom_theme_colors');
                  if (rawCustom) {
                    const c = JSON.parse(rawCustom);
                    const hex = (c.bg || '#000000').replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16) || 0;
                    const g = parseInt(hex.substring(2, 4), 16) || 0;
                    const b = parseInt(hex.substring(4, 6), 16) || 0;
                    isLight = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;

                    document.documentElement.style.setProperty('--background', c.bg);
                    document.documentElement.style.setProperty('--foreground', c.text);
                    document.documentElement.style.setProperty('--card', c.card);
                    document.documentElement.style.setProperty('--primary', c.accent);
                    document.documentElement.style.setProperty('--accent', c.accent);
                    document.documentElement.style.setProperty('--graph-color', c.accent);
                    document.documentElement.style.setProperty('--slate-950', c.bg);
                    document.documentElement.style.setProperty('--slate-900', c.card);
                    document.documentElement.style.setProperty('--slate-850', c.card);
                    document.documentElement.style.setProperty('--slate-800', c.accent + '40');
                    document.documentElement.style.setProperty('--slate-100', c.text);
                    document.documentElement.style.setProperty('--slate-50', c.text);
                    // Mid-range tokens are used throughout the app for secondary/tertiary
                    // text (nav links, table rows, timestamps). Left unset, they fell back
                    // to the dark theme's pale-on-black values, which read as washed-out
                    // low-contrast text against a light custom background.
                    document.documentElement.style.setProperty('--slate-200', 'color-mix(in srgb, ' + c.text + ' 85%, ' + c.bg + ' 15%)');
                    document.documentElement.style.setProperty('--slate-300', 'color-mix(in srgb, ' + c.text + ' 70%, ' + c.bg + ' 30%)');
                    document.documentElement.style.setProperty('--slate-350', 'color-mix(in srgb, ' + c.text + ' 60%, ' + c.bg + ' 40%)');
                    document.documentElement.style.setProperty('--slate-400', 'color-mix(in srgb, ' + c.text + ' 50%, ' + c.bg + ' 50%)');
                    document.documentElement.style.setProperty('--slate-500', 'color-mix(in srgb, ' + c.text + ' 35%, ' + c.bg + ' 65%)');
                    document.documentElement.style.setProperty('--slate-600', 'color-mix(in srgb, ' + c.text + ' 20%, ' + c.bg + ' 80%)');
                    document.documentElement.style.setProperty('--slate-700', 'color-mix(in srgb, ' + c.text + ' 10%, ' + c.bg + ' 90%)');
                  }
                }

                if (isLight) {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <BrandingSyncer />
        {children}
      </body>
    </html>
  );
}

