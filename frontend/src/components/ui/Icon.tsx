// Material Symbols Rounded, loaded as a subset in app/layout.tsx.
// Any new icon name must be added to ICON_NAMES there or it renders as text.
export default function Icon({
  name,
  size = 20,
  filled = false,
  className = "",
}: {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`icon ${className}`}
      style={{ fontSize: size, fontVariationSettings: filled ? "'FILL' 1" : undefined }}
    >
      {name}
    </span>
  );
}
