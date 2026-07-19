import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  primary?: boolean;
}

export default function GlassCard({
  children,
  primary = false,
  className = "",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`${
        primary ? "glass-card-primary" : "glass-card"
      } glass-edge rounded-xl p-container-padding relative overflow-hidden transition-all duration-300 ${className}`}
      {...props}
    >
      {primary && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      )}
      {children}
    </div>
  );
}
