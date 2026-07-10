import Link from 'next/link';

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero" aria-label="Coming soon landing page">
        <div className="logo-container">
          <div className="brand-mark">
            <h2 className="brand-name">Nakhyatra</h2>
          </div>
        </div>
        <div className="content-block">
          <h1>Coming Soon</h1>
          <p className="subtitle">Something extraordinary is on its way</p>
        </div>
        
        <Link href="https://www.instagram.com/nakhyatra.store" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit us on Instagram">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="instagram-icon"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <circle cx="17.5" cy="6.5" r="1.5" />
          </svg>
        </Link>
      </section>
    </main>
  );
}
