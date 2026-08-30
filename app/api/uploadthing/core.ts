import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';

const upload = createUploadthing();

function hasSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    const originHost = new URL(origin).host;
    const requestHosts = [
      new URL(request.url).host,
      request.headers.get('host'),
      request.headers.get('x-forwarded-host'),
    ].filter(Boolean);

    return requestHosts.includes(originHost);
  } catch {
    return false;
  }
}

export const artworkFileRouter = {
  artworkUploader: upload(
    {
      image: {
        maxFileSize: '8MB',
        maxFileCount: 1,
        minFileCount: 1,
      },
    },
    {
      // Vercel preview protection blocks UploadThing's optional server callback.
      // The client only needs the signed UploadThing URL, so don't hold the
      // upload response open while waiting for onUploadComplete.
      awaitServerData: false,
    }
  )
    .middleware(async ({ req }) => {
      if (!hasSameOrigin(req)) {
        throw new UploadThingError('This upload request is not allowed.');
      }

      return { purpose: 'custom-order-artwork' as const };
    })
    .onUploadComplete(async ({ file }) => ({
      url: file.ufsUrl,
      name: file.name,
    })),
} satisfies FileRouter;

export type ArtworkFileRouter = typeof artworkFileRouter;
