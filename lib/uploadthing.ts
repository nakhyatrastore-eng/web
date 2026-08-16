'use client';

import { generateReactHelpers } from '@uploadthing/react';
import type { ArtworkFileRouter } from '@/app/api/uploadthing/core';

export const { useUploadThing } =
  generateReactHelpers<ArtworkFileRouter>();
