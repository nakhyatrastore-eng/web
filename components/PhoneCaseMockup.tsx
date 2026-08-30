export default function PhoneCaseMockup({ imageUrl }: { imageUrl: string | null }) {
  return (
    <div className="relative w-[220px] h-[440px] mx-auto select-none">
      <div
        className="absolute inset-0 rounded-[42px] overflow-hidden bg-bg2"
        style={{ boxShadow: '0 0 0 2px var(--border), 0 25px 50px rgba(0,0,0,.55)' }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Your uploaded design" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink3 text-xs kicker text-center px-6 leading-relaxed">
            Your Design<br />Here
          </div>
        )}
      </div>

      {/* Locked gloss/camera layer: this transparent template is preview-only and is never uploaded. */}
      <img
        src="/images/iphone-11-pro-gloss-template.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 max-w-none w-[238%] -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
}
