export type DropSlide = {
  src: string;
  alt: string;
  title: string;
  caption: string;
  href: string;
  /** object-position for narrow crops, e.g. '72% center' to keep the product in frame */
  focus?: string;
};

/**
 * Drop showcase slider. For a new drop: add the artwork to public/drops/
 * and edit this list — the slider, alt text and links all follow it.
 */
export const dropSlides: DropSlide[] = [
  {
    src: '/og-orange.png',
    alt: 'Nakhyatra drop promo — phone case with a black and white collage artwork on a dark backdrop',
    title: 'Pick the design. Then your phone.',
    caption: 'Every case is made for your exact model — printed to order.',
    href: '/collections/phone-cases',
    focus: '72% center',
  },
  {
    src: '/og-purple.png',
    alt: 'Nakhyatra drop promo artwork',
    title: 'New colourways, same standard.',
    caption: 'Glass-finish artwork panel with a protective bumper.',
    href: '/collections/phone-cases',
  },
  {
    src: '/og-small-drop.png',
    alt: 'Nakhyatra small drop promo artwork',
    title: 'The Small Drop.',
    caption: 'Limited designs. When they sell out, they are gone.',
    href: '/collections/phone-cases',
  },
  {
    src: '/og.png',
    alt: 'Nakhyatra promo artwork',
    title: 'Objects with a point of view.',
    caption: 'Steel posters and phone cases, fulfilled across India.',
    href: '/collections/poster-wall',
  },
];
