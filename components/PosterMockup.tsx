export default function PosterMockup({ imageUrl }: { imageUrl: string | null }) {
  return (
    <div
      className="relative w-[260px] h-[340px] mx-auto flex items-center justify-center select-none"
      style={{ background: 'radial-gradient(circle at 50% 30%, #1c1c1c, #0a0a0a)' }}
    >
      <div
        className="relative w-[220px] h-[300px] p-3"
        style={{
          background:
            'linear-gradient(135deg, #8a8a8a 0%, #dcdcdc 20%, #6b6b6b 50%, #dcdcdc 80%, #8a8a8a 100%)',
          boxShadow: '0 25px 45px rgba(0,0,0,.6)',
        }}
      >
        <div className="w-full h-full bg-bg2 overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Your uploaded design" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink3 text-xs kicker text-center px-6 leading-relaxed">
              Your Design<br />Here
            </div>
          )}
        </div>

        {/* corner bolts, steel-frame detail */}
        <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-black/40" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-black/40" />
        <span className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-black/40" />
        <span className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-black/40" />
      </div>
    </div>
  );
}
