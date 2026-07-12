// components/layout/TopNav.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export function TopNav() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  const userRole = session?.user?.role || "DRIVER";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="lg:hidden" />
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
      </div>

      <div className="flex flex-1 items-center gap-4 md:gap-6 lg:ml-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search vehicles, drivers, trips..."
            className="h-10 w-full rounded-lg border-gray-200 pl-10 pr-4 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationCenter />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userRole}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onSelect={() => signOut({ redirectTo: "/login" })}
                className="text-red-600 cursor-pointer"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
