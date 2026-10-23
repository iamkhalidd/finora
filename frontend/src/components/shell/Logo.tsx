import Icon from "@/components/ui/Icon";

/** `onHero` swaps the green tile for a translucent one so the mark stays visible on green panels. */
export default function Logo({ size = 32, className = "", onHero = false }: { size?: number; className?: string; onHero?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`rounded-[10px] text-on-hero flex ${onHero ? "bg-white/15" : "bg-hero"} items-center justify-center shrink-0`}
        style={{ width: size, height: size }}
      >
        <Icon name="account_balance_wallet" size={size * 0.56} filled />
      </span>
      <span className="font-display font-extrabold tracking-tight" style={{ fontSize: size * 0.62 }}>Finora</span>
    </span>
  );
}
