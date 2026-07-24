import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

// Single endpoint used by the customizer for both poster and phone-case
// uploads — 8MB cap, one file at a time, images only.
export const ourFileRouter = {
  designUploader: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } }).onUploadComplete(
    async ({ file }) => {
      // Runs on the server after upload finishes. Nothing to persist here yet —
      // the file's URL gets attached to the Shopify cart line as a custom
      // property when the customer adds the item to cart.
      return { url: file.url };
    }
  ),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
