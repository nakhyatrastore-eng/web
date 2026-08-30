'use client';

import { useState } from 'react';
import { UploadDropzone } from '@/lib/uploadthing';
import PhoneCaseMockup from './PhoneCaseMockup';
import PosterMockup from './PosterMockup';

export default function Customizer({
  productType,
  onDesignChange,
}: {
  productType: string;
  onDesignChange: (url: string | null) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isCase = productType === 'Phone Case';

  function handleUploaded(url: string) {
    setImageUrl(url);
    onDesignChange(url);
  }

  function handleRemove() {
    setImageUrl(null);
    onDesignChange(null);
  }

  return (
    <div className="border border-border bg-bg2 p-6">
      <div className="eyebrow mb-4">Customize This {isCase ? 'Case' : 'Poster'}</div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-shrink-0 w-full md:w-auto">
          {isCase ? <PhoneCaseMockup imageUrl={imageUrl} /> : <PosterMockup imageUrl={imageUrl} />}
        </div>

        <div className="flex-1 w-full">
          {!imageUrl ? (
            <UploadDropzone
              endpoint="artworkUploader"
              onClientUploadComplete={(res) => {
                const url = res?.[0]?.ufsUrl;
                if (url) handleUploaded(url);
              }}
              onUploadError={(error: Error) => {
                alert(`Upload failed: ${error.message}`);
              }}
              appearance={{
                container: 'border-border bg-bg hover:border-accent transition-colors',
                label: 'text-ink2 kicker',
                allowedContent: 'text-ink3 text-xs',
                button: 'bg-accent hover:bg-accent-h after:bg-accent-h',
              }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-ink2 text-sm">Design uploaded — this is what gets printed.</p>
              <button
                onClick={handleRemove}
                className="border border-border hover:border-accent px-4 py-2 kicker w-fit"
              >
                Remove &amp; Re-upload
              </button>
            </div>
          )}
          <p className="text-ink3 text-xs mt-4 leading-relaxed">
            Your photo is auto-fit to the {isCase ? 'case' : 'poster'}. Ensure your design is high-resolution for the best print quality.
          </p>
        </div>
      </div>
    </div>
  );
}
