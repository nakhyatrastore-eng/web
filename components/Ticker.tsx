export default function Ticker({ text }: { text: string }) {
  const track = `${text} · `.repeat(6);
  return (
    <div className="bg-black border-b border-border overflow-hidden py-2">
      <div className="animate-marquee kicker">
        <span className="ticker-track">{track}</span>
        <span className="ticker-track" aria-hidden>{track}</span>
      </div>
    </div>
  );
}
