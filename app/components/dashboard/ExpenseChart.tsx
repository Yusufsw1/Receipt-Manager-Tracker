"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { formatShortNumber } from "@/lib/formatNumber";
import { Button } from "../ui/button";

interface MonthlyItem {
  month: string;
  expense: number;
}

interface WeeklyItem {
  day: string;
  expense: number;
}

export default function ExpenseChart() {
  const supabase = createSupabaseBrowser();

  const [monthlyData, setMonthlyData] = useState<MonthlyItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyItem[]>([]);
  const [view, setView] = useState<"monthly" | "weekly">("monthly");

  const data = view === "monthly" ? monthlyData : weeklyData;
  const maxValue = Math.max(...data.map((d) => d.expense), 1);

  // 👉 fungsi dipindah ke atas BUKAN di bawah useEffect
  async function fetchExpenses() {
    const { data: receipts, error } = await supabase.from("receipts").select("total_amount, created_at");

    if (error) {
      console.error(error);
      return;
    }

    // ========== GROUP BY MONTH ==========
    const monthly: Record<string, number> = {};

    receipts.forEach((r) => {
      const date = new Date(r.created_at);
      const month = date.toLocaleString("en-US", { month: "short" });

      if (!monthly[month]) monthly[month] = 0;
      monthly[month] += r.total_amount || 0;
    });

    const monthlyArr: MonthlyItem[] = Object.keys(monthly).map((month) => ({
      month,
      expense: monthly[month],
    }));

    // ========== GROUP BY WEEK ==========
    const weekly: Record<string, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    receipts.forEach((r) => {
      const day = new Date(r.created_at).toLocaleString("en-US", {
        weekday: "short",
      });

      if (weekly[day] !== undefined) {
        weekly[day] += r.total_amount || 0;
      }
    });

    const weeklyArr: WeeklyItem[] = Object.keys(weekly).map((day) => ({
      day,
      expense: weekly[day],
    }));

    setMonthlyData(monthlyArr);
    setWeeklyData(weeklyArr);
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Pengeluaran
          </CardTitle>

          <div className="flex gap-2">
            <Button className={`px-3 py-1 rounded-lg text-sm ${view === "monthly" ? "bg-blue-600" : " "}`} onClick={() => setView("monthly")}>
              Bulan
            </Button>

            <Button className={`px-3 py-1 rounded-lg text-sm ${view === "weekly" ? "bg-blue-600 " : ""}`} onClick={() => setView("weekly")}>
              Minggu
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-end h-64 gap-2 mt-4">
          {data.map((item, index) => {
            const height = (item.expense / maxValue) * 100;

            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="flex items-end justify-center w-full h-48">
                  <div className="w-2/3 rounded-t bg-gradient-to-t from-red-500 to-red-400" style={{ height: `${height}%` }} />
                </div>

                <div className="mt-2 text-sm text-gray-500">{item.month || item.day}</div>

                <div className="mt-1 text-xs text-gray-400">Rp.{formatShortNumber(item.expense)}</div>
              </div>
            );
          })}
        </div>

        <div className="grid justify-center gap-4 mt-8 text-center">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium">Total Pengeluaran</span>
            </div>

            <div className="mt-2 text-2xl font-bold">Rp.{formatShortNumber(data.reduce((sum, d) => sum + d.expense, 0))}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
