import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });

// Only these Material Symbols are downloaded (a few KB instead of ~1MB).
// Add any new <Icon name="..."> here.
const ICON_NAMES = [
  "account_balance", "account_balance_wallet", "add", "add_card", "arrow_back", "autorenew",
  "badge", "bolt", "candlestick_chart", "category", "celebration", "check", "check_circle",
  "chevron_left", "chevron_right", "close", "cloud_off", "content_copy", "content_paste",
  "contrast", "currency_exchange", "delete", "directions_car", "done_all", "edit", "error",
  "family_restroom", "flight", "home", "inbox", "insights", "live_tv", "local_gas_station", "lock",
  "logout", "mail", "mark_email_read", "medical_services", "more_horiz", "north_east",
  "open_in_new", "payments", "person", "pie_chart", "receipt_long", "redeem", "refresh", "remove",
  "restaurant", "savings", "schedule", "school", "search", "search_off", "shopping_bag",
  "smartphone", "south_west", "storefront", "task_alt", "trending_up", "visibility",
  "visibility_off", "volunteer_activism", "warning", "work",
];
const ICON_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,0..1,0" +
  `&icon_names=${[...ICON_NAMES].sort().join(",")}&display=block`;

export const metadata: Metadata = {
  title: "Finora",
  description: "Track your naira, stick to your budgets and keep an honest trading journal.",
  appleWebApp: { capable: true, title: "Finora", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0a130f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={ICON_FONT_URL} />
      </head>
      <body className="font-sans min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
