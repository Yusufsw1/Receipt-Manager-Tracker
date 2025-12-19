// app/components/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Menu, PieChart, Home } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import LogoutButton from "@/app/components/ui/LogoutButton";
import ThemeSwitcher from "@/components/ui/ThemeToggle";

interface HeaderProps {
  user: SupabaseUser | null;
}

export default function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getUserDisplayName = () => {
    if (!user) return "Guest";

    const { first_name, last_name, full_name } = user.user_metadata || {};

    return full_name || (first_name && last_name ? `${first_name} ${last_name}` : first_name) || user.email?.split("@")[0] || "User";
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const getUserEmail = () => user?.email || "";
  const mobileNavItems = [{ name: "Dashboard", href: "/dashboard", icon: Home, isButton: false }];

  return (
    <>
      {/* Modal */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="px-4 mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side: Logo */}
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                  <span className="text-lg font-bold text-white">R</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Receipt Manager</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Smart Expense Tracker</span>
                </div>
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative hidden sm:flex"></Button>
              <ThemeSwitcher />

              {/* Scan Receipt Desktop */}

              {/* User Dropdown */}
              <div className="items-center hidden md:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 p-1 pl-3 pr-4 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                      <div className="flex items-center justify-center rounded-full h-9 w-9 bg-gradient-to-r from-blue-500 to-purple-500">
                        <span className="text-sm font-semibold text-white">{getUserInitial()}</span>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{getUserDisplayName()}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{getUserEmail()}</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                        <p className="text-xs leading-none text-gray-500">{getUserEmail()}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <PieChart className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="p-0">
                      <LogoutButton variant="ghost" size="sm" className="justify-start w-full px-2 text-red-600 h-9 hover:text-red-700 hover:bg-red-50" showIcon={true} label="Log out" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  {/* Mobile User */}
                  <div className="flex items-center gap-3 p-4 border-b">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                      <span className="text-lg font-semibold text-white">{getUserInitial()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{getUserDisplayName()}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getUserEmail()}</p>
                    </div>
                  </div>

                  {/* Mobile Nav */}
                  <nav className="flex flex-col p-4 space-y-1">
                    {mobileNavItems.map((item) => {
                      const Icon = item.icon;
                      if (item.isButton) {
                        return (
                          <Button key={item.name} className="justify-start w-full h-12 px-3 rounded-lg" variant="ghost">
                            <Icon className="w-5 h-5 mr-3" />
                            {item.name}
                          </Button>
                        );
                      }
                      return (
                        <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center h-12 px-3 text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                          <Icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Mobile Footer */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <div className="flex flex-col space-y-2">
                      <div className="pt-2">
                        <LogoutButton className="w-full" variant="outline" showIcon={true} label="Log out" />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
