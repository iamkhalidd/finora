export const NAV_ITEMS = [
  { label: "Overview", icon: "home", href: "/dashboard", match: ["/dashboard"] },
  // Imports are reviewed as part of the transaction flow, so their badge lives here
  { label: "Transactions", icon: "receipt_long", href: "/transactions", match: ["/transactions", "/imports"], badge: "imports" as const },
  { label: "Budgets", icon: "pie_chart", href: "/budgets", match: ["/budgets"] },
  { label: "Trading", icon: "candlestick_chart", href: "/trades", match: ["/trades"] },
];

export function isActive(pathname: string, match: string[]) {
  return match.some((m) => pathname === m || pathname.startsWith(m + "/"));
}

/** The one "add" action, which follows the section you are in. */
export function quickAdd(pathname: string) {
  return isActive(pathname, ["/trades"])
    ? { href: "/trades/new", label: "Log a trade" }
    : { href: "/transactions/new", label: "Add transaction" };
}
