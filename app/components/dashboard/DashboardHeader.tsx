"use client";

import { Button } from "@/app/components/ui/button";
import { FilePlusCorner, User } from "lucide-react";
import { useState } from "react";
import ReceiptModal from "../scan/ReceiptModal";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface HeaderProps {
  user: SupabaseUser | null;
}

export default function DashboardHeader({ user }: HeaderProps) {
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  const handleScanClick = () => {
    setIsScanModalOpen(true);
  };

  return (
    <>
      {user && <ReceiptModal userId={user.id} isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} />}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-r from-blue-500 to-purple-500">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">{getGreeting()}</h1>
              <p className="text-gray-600 dark:text-gray-400">Welcome to your personal finance dashboard</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          {/* Action Buttons */}
          <Button onClick={handleScanClick} className="p-3 mb-2 md:hidden" size="lg">
            <FilePlusCorner className="w-5 h-5" />
          </Button>

          {/* Desktop: ikon + teks */}
          <Button onClick={handleScanClick} className="items-center hidden gap-2 p-3 mb-2 md:flex" size="lg">
            <FilePlusCorner className="w-4 h-4" />
            Tambah Pengeluaran
          </Button>
        </div>
      </div>
    </>
  );
}
