import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
                const savedTheme = localStorage.getItem('organization_theme_palette') || 'dark-emerald';
                document.documentElement.setAttribute('data-theme', savedTheme);
                if (savedTheme === 'light-executive') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }

                if (savedTheme === 'custom') {
                  const rawCustom = localStorage.getItem('organization_custom_theme_colors');
                  if (rawCustom) {
                    const c = JSON.parse(rawCustom);
                    document.documentElement.style.setProperty('--background', c.bg);
                    document.documentElement.style.setProperty('--foreground', c.text);
                    document.documentElement.style.setProperty('--card', c.card);
                    document.documentElement.style.setProperty('--primary', c.accent);
                    document.documentElement.style.setProperty('--accent', c.accent);
                    document.documentElement.style.setProperty('--slate-950', c.bg);
                    document.documentElement.style.setProperty('--slate-900', c.card);
                    document.documentElement.style.setProperty('--slate-850', c.card);
                    document.documentElement.style.setProperty('--slate-800', c.accent + '40');
                    document.documentElement.style.setProperty('--slate-100', c.text);
                    document.documentElement.style.setProperty('--slate-50', c.text);
                  }
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
