import {
  type LucideIcon,
  Apple,
  Milk,
  Beef,
  CakeSlice,
  Package,
  Snowflake,
} from 'lucide-react';

export type Icon = LucideIcon;

export const Icons = {
  logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5.5 21a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2" />
      <path d="M15.5 5a2.5 2.5 0 0 0-5 0" />
      <path d="m12 15-3-3" />
      <path d="m9 12 3 3" />
    </svg>
  ),
  apple: Apple,
  milk: Milk,
  meat: Beef,
  bakery: CakeSlice,
  pantry: Package,
  frozen: Snowflake,
};
