import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { active?: boolean };

const defaults = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconCart(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6" />
      <circle cx="10" cy="20" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconHome({ active, ...props }: IconProps) {
  return (
    <svg {...defaults} {...props} fill={active ? 'currentColor' : 'none'}>
      <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function IconPhone({ active, ...props }: IconProps) {
  return (
    <svg {...defaults} {...props} fill={active ? 'currentColor' : 'none'}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M10 5h4M11 19h2" />
    </svg>
  );
}

export function IconFrame({ active, ...props }: IconProps) {
  return (
    <svg {...defaults} {...props} fill={active ? 'currentColor' : 'none'}>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="m7 16 4-4 3 3 3-4 2 3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
  );
}

export function IconCreate({ active, ...props }: IconProps) {
  return (
    <svg {...defaults} {...props} fill={active ? 'currentColor' : 'none'}>
      <rect x="3" y="4" width="14" height="16" rx="1" />
      <path d="m6 15 3-3 2.5 2.5L14 11l3 4M19 5v6M16 8h6" />
    </svg>
  );
}

export function IconInstagram(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconMinus(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function IconTruck(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 3 5 6v5c0 4.7 2.8 8.1 7 10 4.2-1.9 7-5.3 7-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
