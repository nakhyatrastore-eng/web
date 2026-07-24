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

      {/* camera cutout — sits above the image, masks that corner */}
      <div className="absolute top-5 left-5 w-16 h-16 rounded-2xl bg-bg border-2 border-black/40 flex items-center justify-center gap-1.5 p-2">
        <span className="w-4 h-4 rounded-full bg-black/70 block" />
        <span className="w-4 h-4 rounded-full bg-black/70 block" />
      </div>

      {/* side button hints */}
      <div className="absolute -left-[3px] top-24 w-[3px] h-10 bg-border rounded-full" />
      <div className="absolute -right-[3px] top-32 w-[3px] h-16 bg-border rounded-full" />
    </div>
  );
}
