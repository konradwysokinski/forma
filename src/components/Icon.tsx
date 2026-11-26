import type { SVGProps } from 'react';

/** Thin-stroke icons on a 17×17 grid, as in the designs. */
const PATHS = {
  form: <path d="M1.5 12.5c2-5 4-7 6-4s4.5 1 8-6" />,
  // A cog: eight teeth round a ring (Kilometr's, moved onto the 17px grid).
  settings: (
    <g transform="translate(0.5 0.5)">
      <path d="M6.82 3.61L7.06 2.07A6 6 0 0 1 8.94 2.07L9.18 3.61A4.55 4.55 0 0 1 10.28 4.06L11.53 3.15A6 6 0 0 1 12.85 4.47L11.94 5.73A4.55 4.55 0 0 1 12.39 6.82L13.93 7.06A6 6 0 0 1 13.93 8.94L12.39 9.18A4.55 4.55 0 0 1 11.94 10.27L12.85 11.53A6 6 0 0 1 11.53 12.85L10.28 11.94A4.55 4.55 0 0 1 9.18 12.39L8.94 13.93A6 6 0 0 1 7.06 13.93L6.82 12.39A4.55 4.55 0 0 1 5.73 11.94L4.47 12.85A6 6 0 0 1 3.15 11.53L4.06 10.27A4.55 4.55 0 0 1 3.61 9.18L2.07 8.94A6 6 0 0 1 2.07 7.06L3.61 6.82A4.55 4.55 0 0 1 4.06 5.72L3.15 4.47A6 6 0 0 1 4.47 3.15L5.72 4.06A4.55 4.55 0 0 1 6.82 3.61Z" />
      <circle cx="8" cy="8" r="1.9" />
    </g>
  ),
  heart: <path d="M8.5 14.2s-5.8-3.4-5.8-7.6a3.1 3.1 0 0 1 5.8-1.6 3.1 3.1 0 0 1 5.8 1.6c0 4.2-5.8 7.6-5.8 7.6z" />,
  info: (
    <>
      <circle cx="8.5" cy="8.5" r="6.5" />
      <path d="M8.5 7.6v4" />
      <circle cx="8.5" cy="5.4" r="0.4" fill="currentColor" />
    </>
  ),
  close: <path d="M4.5 4.5l8 8M12.5 4.5l-8 8" />,
  external: <path d="M7 4h6v6M13 4 4.5 12.5" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 17, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 17 17"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
