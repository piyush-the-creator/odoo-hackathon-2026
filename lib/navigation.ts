// lib/navigation.ts
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  AlertTriangle,
  Fuel,
  DollarSign,
  FileText,
  Settings,
  UserCog,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  children?: NavItem[];
}

export const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Vehicles",
    href: "/vehicles",
    icon: Truck,
    roles: ["ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"],
  },
  {
    title: "Drivers",
    href: "/drivers",
    icon: Users,
    roles: ["ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"],
  },
  {
    title: "Trips",
    href: "/trips",
    icon: Route,
    roles: ["ADMIN", "FLEET_MANAGER", "DRIVER"],
  },
  {
    title: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
    roles: ["ADMIN", "FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER"],
  },
  {
    title: "Breakdowns",
    href: "/breakdowns",
    icon: AlertTriangle,
    roles: ["ADMIN", "FLEET_MANAGER", "DRIVER"],
  },
  {
    title: "Fuel Logs",
    href: "/fuel",
    icon: Fuel,
    roles: ["ADMIN", "FLEET_MANAGER", "DRIVER", "FINANCIAL_ANALYST"],
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: DollarSign,
    roles: ["ADMIN", "FLEET_MANAGER", "FINANCIAL_ANALYST"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    roles: ["ADMIN", "FLEET_MANAGER", "FINANCIAL_ANALYST"],
  },
  {
    title: "Users",
    href: "/users",
    icon: UserCog,
    roles: ["ADMIN"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export const getNavigationItems = (role: string): NavItem[] => {
  return navigationItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );
};
