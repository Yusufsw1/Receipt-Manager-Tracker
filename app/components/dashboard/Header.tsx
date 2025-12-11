// app/components/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Menu, User, Bell, CreditCard, PieChart, ScanLine, FileText, Settings, Home } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import LogoutButton from "@/app/components/ui/LogoutButton";
import ReceiptModal from "../scan/ReceiptModal"; // import modal
import ThemeSwitcher from "@/components/ui/ThemeToggle";

interface HeaderProps {
  user: SupabaseUser | null;
}

// Navigation items for mobile menu
const mobileNavItems = [{ name: "Dashboard", href: "/dashboard", icon: Home }];

export default function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getUserDisplayName = () => {
    if (!user) return "Guest";
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    const fullName = user.user_metadata?.full_name;
    if (fullName) return fullName;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    return user.email?.split("@")[0] || "User";
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const getUserEmail = () => user?.email || "";

  return (
    <>
      {/* Modal */}
      {/* {user && <ReceiptModal userId={user.id} isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} />} */}

      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side: Logo */}
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
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
              <Button variant="ghost" size="icon" className="hidden sm:flex relative"></Button>
              <ThemeSwitcher />

              {/* Scan Receipt Desktop */}

              {/* User Dropdown */}
              <div className="hidden md:flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 rounded-full p-1 pl-3 pr-4 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
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
                        <PieChart className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="p-0">
                      <LogoutButton variant="ghost" size="sm" className="w-full justify-start h-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50" showIcon={true} label="Log out" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  {/* Mobile User */}
                  <div className="flex items-center gap-3 p-4 border-b">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                      <span className="text-lg font-semibold text-white">{getUserInitial()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{getUserDisplayName()}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getUserEmail()}</p>
                    </div>
                  </div>

                  {/* Mobile Nav */}
                  <nav className="flex flex-col space-y-1 p-4">
                    {mobileNavItems.map((item) => {
                      const Icon = item.icon;
                      if (item.isButton) {
                        return (
                          <Button key={item.name} className="w-full justify-start h-12 px-3 rounded-lg" variant="ghost">
                            <Icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </Button>
                        );
                      }
                      return (
                        <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center h-12 px-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                          <Icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Mobile Footer */}
                  <div className="absolute bottom-0 left-0 right-0 border-t p-4">
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
