import type { SVGProps } from 'react';

/** Thin-stroke icons on a 17×17 grid, as in the designs. */
const PATHS = {
  form: <path d="M1.5 12.5c2-5 4-7 6-4s4.5 1 8-6" />,
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
