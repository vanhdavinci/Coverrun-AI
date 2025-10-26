import { LayoutDashboard, Wallet, Receipt, BarChart2, User, LucideIcon } from "lucide-react";

interface SideBarOption {
  name: string;
  icon: LucideIcon;
  path: string;
}

export const SideBarOptions: SideBarOption[] = [
  {
    name: 'Overview',
    icon: LayoutDashboard,
    path: '/overview',
  },
  {
    name: 'Jars',
    icon: Wallet,
    path: '/jars',
  },
  {
    name: 'Transactions',
    icon: Receipt,
    path: '/transactions',
  },
  {
    name: 'Analytics',
    icon: BarChart2,
    path: '/analytics',
  },
  {
    name: 'Profile',
    icon: User,
    path: '/profile',
  },
];
