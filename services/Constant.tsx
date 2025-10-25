import { LayoutDashboard, Wallet, Receipt, BarChart2, LucideIcon } from "lucide-react";

interface SideBarOption {
  name: string;
  icon: LucideIcon;
  path: string;
}

export const SideBarOptions: SideBarOption[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
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
];
