export default function Loading() {
  return (
    <div
      className="mx-auto min-h-[60vh] max-w-[1280px] animate-pulse px-4 py-12 md:px-8 md:py-20"
      aria-label="Loading"
      role="status"
    >
      <div className="h-3 w-36 bg-bg3" />
      <div className="mt-5 h-14 max-w-2xl bg-bg3 md:h-20" />
      <div className="mt-4 h-5 max-w-lg bg-bg3" />
    </div>
  );
}
