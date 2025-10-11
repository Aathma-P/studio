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
      <path d="m12 3-8 9 9-1-1 9 9-9Z" />
      <path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />
    </svg>
  ),
  apple: Apple,
  milk: Milk,
  meat: Beef,
  bakery: CakeSlice,
  pantry: Package,
  frozen: Snowflake,
};
