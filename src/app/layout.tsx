import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BrandingSyncer from "@/components/BrandingSyncer";
import prisma from "@/lib/prisma";

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

// The root layout reads the org's theme straight from the database on every
// request so a Director/Superadmin's choice in Control Panel applies to all
// staff immediately -- without this, Next.js would statically cache the
// theme from build time and changes wouldn't show up until the next deploy.
export const dynamic = "force-dynamic";

const BUILT_IN_LIGHT_THEMES = ["light-executive", "light-sage", "light-clean"];

type CustomThemeColors = { bg?: string; text?: string; card?: string; accent?: string };

// Computes whether the theme reads as light (for the .dark class) and, for a
// custom palette, the CSS custom-property overrides -- mirrors the logic
// that used to run client-side against localStorage, but against the
// org-wide value from the database instead, so it's authoritative for every
// staff login and renders correctly on the very first paint (no FOUC).
function computeThemeAttrs(themePalette: string, customColors: unknown) {
  let isLight = BUILT_IN_LIGHT_THEMES.includes(themePalette);
  let styleVars: Record<string, string> | undefined;

  if (themePalette === "custom" && customColors && typeof customColors === "object") {
    const c = customColors as CustomThemeColors;
    const bg = c.bg || "#000000";
    const hex = bg.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    isLight = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;

    styleVars = {
      "--background": c.bg || "",
      "--foreground": c.text || "",
      "--card": c.card || "",
      "--primary": c.accent || "",
      "--accent": c.accent || "",
      "--graph-color": c.accent || "",
      "--slate-950": c.bg || "",
      "--slate-900": c.card || "",
      "--slate-850": c.card || "",
      "--slate-800": `${c.accent || ""}40`,
      "--slate-100": c.text || "",
      "--slate-50": c.text || "",
      "--slate-200": `color-mix(in srgb, ${c.text} 85%, ${c.bg} 15%)`,
      "--slate-300": `color-mix(in srgb, ${c.text} 70%, ${c.bg} 30%)`,
      "--slate-350": `color-mix(in srgb, ${c.text} 60%, ${c.bg} 40%)`,
      "--slate-400": `color-mix(in srgb, ${c.text} 50%, ${c.bg} 50%)`,
      "--slate-500": `color-mix(in srgb, ${c.text} 35%, ${c.bg} 65%)`,
      "--slate-600": `color-mix(in srgb, ${c.text} 20%, ${c.bg} 80%)`,
      "--slate-700": `color-mix(in srgb, ${c.text} 10%, ${c.bg} 90%)`,
    };
  }

  return { isLight, styleVars };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const org = await prisma.organization.findFirst({
    select: { themePalette: true, customThemeColors: true, faviconUrl: true },
  });

  const themePalette = org?.themePalette || "light-executive";
  const { isLight, styleVars } = computeThemeAttrs(themePalette, org?.customThemeColors);

  return (
    <html
      lang="en"
      data-theme={themePalette}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${isLight ? "" : " dark"}`}
      style={styleVars as React.CSSProperties}
      suppressHydrationWarning
    >
      <head>
        {org?.faviconUrl && <link rel="icon" href={org.faviconUrl} />}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTitle = localStorage.getItem('organization_title_tag');
                if (savedTitle) {
                  document.title = savedTitle;
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
