const message = 'Choose your phone model or print size · fulfilled to order · secure checkout';

export default function AnnouncementBar() {
  return (
    <aside className="h-9 overflow-hidden border-b border-accent/30 bg-accent text-black" aria-label="Store announcement">
      <div className="marquee-rail h-full items-center" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <span key={item} className="flex shrink-0 items-center whitespace-nowrap px-5 text-[11px] font-black uppercase tracking-[0.1em] after:ml-10 after:h-1 after:w-1 after:rounded-full after:bg-black/50 md:px-8">
            {message}
          </span>
        ))}
      </div>
      <span className="sr-only">{message}</span>
    </aside>
  );
}
