import Link from 'next/link';
import { IconArrowRight } from './icons';

const themes = [
  ['cyberpunk', 'Cyberpunk', 'Violet signal'],
  ['jdm', 'JDM', 'After dark'],
  ['samurai', 'Samurai', 'Steel & ink'],
  ['anime', 'Anime', 'Original energy'],
  ['space', 'Space', 'Deep orbit'],
  ['dark-minimal', 'Dark minimal', 'Less, harder'],
  ['abstract', 'Abstract', 'Form & noise'],
] as const;

export default function ThemeRail() {
  return (
    <div className="flex snap-x gap-3 overflow-x-auto pb-3">
      {themes.map(([handle, title, note], index) => (
        <Link key={handle} href={`/themes/${handle}`} className="group relative min-h-64 min-w-[72vw] snap-start overflow-hidden border border-line bg-surface p-5 transition-[border-color,transform] duration-primary ease-primary hover:-translate-y-1 hover:border-accent sm:min-w-[300px]">
          <span className="font-mono text-[9px] uppercase tracking-widest text-ink-3">0{index + 1}</span>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-accent">{note}</p>
            <div className="mt-2 flex items-end justify-between gap-5">
              <h3 className="font-display text-3xl font-extrabold uppercase leading-none text-white">{title}</h3>
              <IconArrowRight className="h-5 w-5 text-accent transition-transform duration-primary ease-primary group-hover:translate-x-1" />
            </div>
          </div>
          <div aria-hidden="true" className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-accent/20 bg-accent/5 blur-sm transition-transform duration-smooth ease-smooth group-hover:scale-125" />
        </Link>
      ))}
      <Link href="/create" className="group relative min-h-64 min-w-[72vw] snap-start overflow-hidden border border-accent bg-accent p-5 text-black sm:min-w-[300px]">
        <span className="font-mono text-[9px] uppercase tracking-widest">08 · No limits</span>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="font-mono text-[9px] uppercase tracking-widest">Upload your image</p>
          <div className="mt-2 flex items-end justify-between gap-5">
            <h3 className="font-display text-3xl font-extrabold uppercase leading-none">Your artwork</h3>
            <IconArrowRight className="h-5 w-5 transition-transform duration-primary ease-primary group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </div>
  );
}
