export default function Footer() {
  return (
    <footer className="border-t border-border pt-16 pb-10">
      <div className="max-w-[1180px] mx-auto px-6">
        <div className="text-[clamp(48px,10vw,140px)] font-extrabold tracking-tighter leading-none mb-8">
          NAKHY<span className="text-accent">/</span>ATRA
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 kicker">
          <div className="flex flex-col gap-3">
            <span className="text-ink">Shop</span>
            <a href="/collections/poster-wall" className="hover:text-accent">Poster Wall</a>
            <a href="/collections/phone-cases" className="hover:text-accent">Phone Cases</a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-ink">Support</span>
            <a href="#" className="hover:text-accent">Shipping</a>
            <a href="#" className="hover:text-accent">Returns</a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-ink">Follow</span>
            <a href="https://www.instagram.com/nakhyatra.store" target="_blank" className="hover:text-accent">Instagram</a>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border text-ink3 kicker">
          © {new Date().getFullYear()} NAKHYATRA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
