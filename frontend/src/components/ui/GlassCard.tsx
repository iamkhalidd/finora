import React from "react";

type GlassVariant = "default" | "primary" | "success" | "danger";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** @deprecated use variant="primary" */
  primary?: boolean;
  variant?: GlassVariant;
}

const variantClasses: Record<GlassVariant, string> = {
  default: "glass-card glass-edge",
  primary: "glass-card-primary",
  success:
    "bg-tertiary/10 backdrop-blur-xl border border-tertiary/20 shadow-[0_4px_24px_rgba(73,223,155,0.1)]",
  danger:
    "bg-error/10 backdrop-blur-xl border border-error/20 shadow-[0_4px_24px_rgba(255,180,171,0.1)]",
};

export default function GlassCard({
  children,
  primary = false,
  variant,
  className = "",
  ...props
}: GlassCardProps) {
  // Resolve variant: explicit variant prop takes precedence, then legacy primary prop
  const resolvedVariant: GlassVariant = variant ?? (primary ? "primary" : "default");
  const base = variantClasses[resolvedVariant];

  return (
    <div
      className={`${base} rounded-2xl p-5 relative overflow-hidden transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Decorative orb for primary / success / danger variants */}
      {resolvedVariant === "primary" && (
        <>
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/15 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-container/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none" />
        </>
      )}
      {resolvedVariant === "success" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      )}
      {resolvedVariant === "danger" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      )}
      {children}
    </div>
  );
}
