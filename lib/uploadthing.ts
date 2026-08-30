'use client';

import { generateReactHelpers, generateUploadDropzone } from '@uploadthing/react';
import type { ArtworkFileRouter } from '@/app/api/uploadthing/core';

export const { useUploadThing } =
  generateReactHelpers<ArtworkFileRouter>();

// Kept for the legacy product-page customizer while the modern create studio uses useUploadThing.
export const UploadDropzone = generateUploadDropzone<ArtworkFileRouter>();
