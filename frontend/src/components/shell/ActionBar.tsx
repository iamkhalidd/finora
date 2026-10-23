/** Save bar for full-screen forms: pinned to the bottom on phones, inline at the end of the form card on desktop. */
export default function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-bg/95 backdrop-blur-md border-t border-line pb-safe lg:static lg:z-auto lg:bg-transparent lg:backdrop-blur-none lg:border-t lg:pt-5 lg:pb-0">
      <div className="max-w-xl mx-auto px-4 py-3 flex gap-2 lg:max-w-none lg:p-0">{children}</div>
    </div>
  );
}
