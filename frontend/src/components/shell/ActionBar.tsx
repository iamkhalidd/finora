/** Sticky save bar for full-screen forms; clears the desktop sidebar. */
export default function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 inset-x-0 lg:left-64 z-30 bg-bg/95 backdrop-blur-md border-t border-line pb-safe">
      <div className="max-w-xl mx-auto px-4 py-3 flex gap-2">{children}</div>
    </div>
  );
}
