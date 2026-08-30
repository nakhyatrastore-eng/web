import { createRouteHandler } from 'uploadthing/next';
import { artworkFileRouter } from './core';

export const { GET, POST } = createRouteHandler({
  router: artworkFileRouter,
});
