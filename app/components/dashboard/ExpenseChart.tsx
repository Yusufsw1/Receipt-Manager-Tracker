"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { formatShortNumber } from "@/lib/formatNumber";
import { Button } from "../ui/button";

interface Receipt {
  total_amount: number;
  created_at: string;
}

export default function ExpenseChart() {
  const supabase = createSupabaseBrowser();

  // Kita hanya simpan raw data dari Supabase di state
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [view, setView] = useState<"monthly" | "weekly">("monthly");
  const [loading, setLoading] = useState(true);

  // 1. Fungsi Fetch Data (Hanya ambil data, tidak memproses grafik)
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("receipts").select("total_amount, created_at").order("created_at", { ascending: true });

      if (error) throw error;
      setReceipts(data || []);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // 2. Gunakan useMemo untuk memproses data grafik (Lebih Efisien & Tanpa Error)
  const chartData = useMemo(() => {
    if (view === "monthly") {
      const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthly: Record<string, number> = {};

      receipts.forEach((r) => {
        const month = new Date(r.created_at).toLocaleString("en-US", { month: "short" });
        monthly[month] = (monthly[month] || 0) + (r.total_amount || 0);
      });

      return monthOrder.map((month) => ({
        label: month,
        expense: monthly[month] || 0,
      }));
    } else {
      const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const weekly: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

      receipts.forEach((r) => {
        const day = new Date(r.created_at).toLocaleString("en-US", { weekday: "short" });
        if (weekly[day] !== undefined) {
          weekly[day] += r.total_amount || 0;
        }
      });

      return daysOrder.map((day) => ({
        label: day,
        expense: weekly[day],
      }));
    }
  }, [receipts, view]);

  const maxValue = Math.max(...chartData.map((d) => d.expense), 1);
  const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0);

  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Pengeluaran
          </CardTitle>

          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl dark:bg-gray-800">
            <Button
              variant={view === "monthly" ? "default" : "ghost"}
              className={`px-4 py-1 rounded-lg text-sm transition-all ${view === "monthly" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500"}`}
              onClick={() => setView("monthly")}
            >
              Bulan
            </Button>

            <Button variant={view === "weekly" ? "default" : "ghost"} className={`px-4 py-1 rounded-lg text-sm transition-all ${view === "weekly" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500"}`} onClick={() => setView("weekly")}>
              Minggu
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64 italic text-gray-400">Memuat data...</div>
        ) : (
          <div className="flex items-end h-64 gap-2 px-2 mt-4">
            {chartData.some((d) => d.expense > 0) ? (
              chartData.map((item, index) => {
                const height = (item.expense / maxValue) * 100;
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <div className="relative flex items-end justify-center w-full h-48">
                      <div className="absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">Rp{item.expense.toLocaleString()}</div>
                      <div
                        className="w-full transition-all duration-500 ease-out rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 group-hover:from-blue-500 group-hover:to-blue-300"
                        style={{ height: `${height}%`, minHeight: "2px" }}
                      />
                    </div>
                    <div className="mt-2 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">{item.label}</div>
                    <div className="mt-1 text-[10px] text-gray-400 font-semibold">{formatShortNumber(item.expense)}</div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center w-full h-full italic text-gray-400">Tidak ada data pengeluaran</div>
            )}
          </div>
        )}

        <div className="grid justify-center gap-4 mt-8 text-center">
          <div className="p-4 px-10 border border-blue-100 rounded-2xl bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Total {view === "monthly" ? "Bulan Ini" : "Minggu Ini"}</span>
            </div>
            <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">Rp {totalExpense.toLocaleString("id-ID")}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
