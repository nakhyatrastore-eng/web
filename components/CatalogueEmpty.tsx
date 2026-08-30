import Link from 'next/link';

export default function CatalogueEmpty({
  title = 'The catalogue is ready for its first drop.',
  body = 'Products appear here automatically as soon as they are active and published to Shopify’s Headless sales channel.',
  compact = false,
}: {
  title?: string;
  body?: string;
  compact?: boolean;
}) {
  return (
    <div className={`border border-line bg-surface ${compact ? 'p-6' : 'p-8 md:p-12'}`}>
      <p className="eyebrow">Catalogue status</p>
      <h3 className={`mt-4 font-display font-extrabold uppercase leading-none text-white ${compact ? 'text-2xl' : 'text-3xl md:text-5xl'}`}>
        {title}
      </h3>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-2 md:text-base">{body}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/create" className="button-primary liquid-button">
          <span className="liquid-fill" aria-hidden="true" />
          <span className="liquid-label">Create your own</span>
        </Link>
        <Link href="/policies/contact" className="button-ghost">Ask a question</Link>
      </div>
    </div>
  );
}
