"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

import Header from "../components/dashboard/Header";
import DashboardHeader from "@/app/components/dashboard/DashboardHeader";
import ReceiptList from "../components/scan/ReceiptList";
import CategorySpending from "../components/dashboard/CategorySpending";
import ExpenseChart from "../components/dashboard/ExpenseChart";
import { Input } from "../components/ui/input";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const supabase = createSupabaseBrowser();

  const [user, setUser] = useState<User | null>(null);

  // ----------------------------
  // FILTER STATES (PARENT)
  // ----------------------------
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ----------------------------
  // GET CURRENT USER (CLIENT)
  // ----------------------------
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) redirect("/auth/login");
      setUser(user);
    }
    loadUser();
  }, []);

  console.log(user);

  if (!user) return null; // loading state optional

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <Header user={user} />

      <div className="pt-4 pl-8 pr-7">
        <DashboardHeader user={user} />
        <div className="flex items-center justify-center gap-3">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[150px]" />

          <span className="text-sm text-muted-foreground">to</span>

          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[150px]" />
        </div>
      </div>

      <div className="p-2 px-4 py-8 mx-auto sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* CATEGORY SPENDING */}
          <div>
            <CategorySpending startDate={startDate} endDate={endDate} />
          </div>

          {/* RECEIPT LIST */}
          <div className="space-y-6 lg:col-span-2">
            <ReceiptList userId={user.id} startDate={startDate} endDate={endDate} />
          </div>
        </div>
        <div className="mt-5">
          <ExpenseChart />
        </div>
        {/* EXPENSE CHART */}
      </div>
    </div>
  );
}
