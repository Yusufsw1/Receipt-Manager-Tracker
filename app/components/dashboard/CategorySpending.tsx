"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { MoreVertical, TrendingUp, TrendingDown, Edit2, Check, X } from "lucide-react";
import { formatShortNumber } from "@/lib/formatNumber";

type CategoryBudgetRow = {
  id?: string;
  user_id?: string;
  category: string;
  budget_amount: number;
};

type ReceiptRow = {
  category?: string;
  total_amount?: number;
  created_at?: string;
};

type Props = {
  startDate?: string; // optional: "YYYY-MM-DD"
  endDate?: string; // optional: "YYYY-MM-DD"
};

const defaultUI: Record<string, { icon: string; color: string; budget: number }> = {
  "Food & Dining": { icon: "🍕", color: "bg-red-100 text-red-600", budget: 500 },
  Transportation: { icon: "🚗", color: "bg-blue-100 text-blue-600", budget: 300 },
  Shopping: { icon: "🛍️", color: "bg-purple-100 text-purple-600", budget: 400 },
  Entertainment: { icon: "🎬", color: "bg-amber-100 text-amber-600", budget: 250 },
  "Bills & Utilities": { icon: "📱", color: "bg-green-100 text-green-600", budget: 350 },
  Health: { icon: "💊", color: "bg-pink-100 text-pink-600", budget: 300 },
};

export default function CategorySpending({ startDate, endDate }: Props) {
  const supabase = createSupabaseBrowser();

  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudgetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [draftBudgets, setDraftBudgets] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // load receipts + budgets
  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      setLoading(true);
      setErrorMsg(null);

      try {
        // receipts query
        let q = supabase.from("receipts").select("category, total_amount, created_at");

        if (startDate) q = q.gte("created_at", startDate);
        if (endDate) q = q.lte("created_at", endDate + "T23:59:59");

        const { data: receiptsData, error: receiptsError } = await q;
        if (receiptsError) throw receiptsError;

        // get current user id (for budgets)
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) {
          // still set receipts, but budgets can't be loaded
          if (mounted) {
            setReceipts((receiptsData as ReceiptRow[]) || []);
            setBudgets([]);
            setLoading(false);
          }
          return;
        }

        // budgets for user
        const { data: budgetRows, error: budgetError } = await supabase.from("category_budgets").select("*").eq("user_id", userId);

        if (budgetError) throw budgetError;

        if (mounted) {
          setReceipts((receiptsData as ReceiptRow[]) || []);
          setBudgets((budgetRows as CategoryBudgetRow[]) || []);
        }
      } catch (err: any) {
        console.error("CategorySpending load error:", err);
        if (mounted) setErrorMsg(err.message || "Failed to load category data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();

    return () => {
      mounted = false;
    };
  }, [startDate, endDate, supabase]);

  // derive grouped spending per category from receipts
  const grouped = useMemo(() => {
    const map: Record<string, number> = {};
    receipts.forEach((r) => {
      const cat = r.category || "Uncategorized";
      map[cat] = (map[cat] || 0) + (Number(r.total_amount) || 0);
    });
    return map;
  }, [receipts]);

  // merge budgets and grouped spending into display rows
  const rows = useMemo(() => {
    // categories from receipts + budgets keys + defaultUI keys
    const keys = new Set<string>();
    Object.keys(grouped).forEach((k) => keys.add(k));
    budgets.forEach((b) => keys.add(b.category));
    Object.keys(defaultUI).forEach((k) => keys.add(k));

    const { data: userData } = supabase.auth.getUser(); // returns Promise-like object here but okay to check later

    const arr = Array.from(keys).map((cat) => {
      const budgetRow = budgets.find((b) => b.category === cat);
      const defaultRow = defaultUI[cat];

      return {
        category: cat,
        amount: grouped[cat] || 0,
        budget: budgetRow ? Number(budgetRow.budget_amount) : defaultRow ? defaultRow.budget : 0,
        icon: defaultRow ? defaultRow.icon : "📦",
        color: defaultRow ? defaultRow.color : "bg-gray-100 text-gray-600",
        budgetRowId: budgetRow?.id,
      };
    });

    // sort by amount desc
    arr.sort((a, b) => b.amount - a.amount);
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grouped, budgets]);

  // initialize draftBudgets when rows change
  useEffect(() => {
    const d: Record<string, string> = {};
    rows.forEach((r) => {
      d[r.category] = String(r.budget || 0);
    });
    setDraftBudgets(d);
  }, [rows]);

  // helper to save/ upsert budget (Supabase)
  async function saveBudget(category: string) {
    setErrorMsg(null);
    setSavingCategory(category);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("No user logged in");

      const valueStr = draftBudgets[category] ?? "0";
      const valueNum = Number(valueStr) || 0;

      const payload = {
        user_id: userId,
        category,
        budget_amount: valueNum,
      };

      // upsert (insert or update) using unique (user_id, category)
      const { error } = await supabase.from("category_budgets").upsert(payload, {
        onConflict: ["user_id", "category"],
        returning: "representation",
      });

      if (error) throw error;

      // reload budgets (or optimistically update)
      const { data: refreshed } = await supabase.from("category_budgets").select("*").eq("user_id", userId);

      setBudgets((refreshed as CategoryBudgetRow[]) || []);
      setEditing((prev) => ({ ...prev, [category]: false }));
    } catch (err: any) {
      console.error("saveBudget error", err);
      setErrorMsg(err.message || "Failed saving budget");
    } finally {
      setSavingCategory(null);
    }
  }

  // UI events
  function startEdit(cat: string) {
    setEditing((prev) => ({ ...prev, [cat]: true }));
  }
  function cancelEdit(cat: string) {
    setEditing((prev) => ({ ...prev, [cat]: false }));
    // reset draft to current budget
    const b = budgets.find((bb) => bb.category === cat);
    const defaultRow = defaultUI[cat];
    setDraftBudgets((prev) => ({ ...prev, [cat]: String(b ? Number(b.budget_amount) : defaultRow ? defaultRow.budget : 0) }));
  }
  const visibleRows = showAll ? rows : rows.slice(0, 3);
  return (
    <Card className="border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Category Spending</CardTitle>
          <div className="flex items-center gap-2"></div>
        </div>
      </CardHeader>

      <CardContent>
        {errorMsg && <div className="mb-2 text-sm text-red-600">{errorMsg}</div>}
        {loading && <div className="mb-2 text-sm text-gray-500">Loading...</div>}

        <div className="space-y-4">
          {visibleRows.map((row) => {
            const percentage = Math.min(100, (row.amount / (row.budget || 1)) * 100);
            const isOver = row.amount > (row.budget || 0);

            return (
              <div key={row.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${row.color} w-10 h-10 rounded-full flex items-center justify-center text-lg`}>{row.icon}</div>

                    <div>
                      <p className="font-medium">{row.category}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div>
                          Rp. {formatShortNumber(row.amount)} / Rp.{formatShortNumber(row.budget)}
                        </div>

                        <div className={`flex items-center gap-1 ${row.amount - (row.budget || 0) >= 0 ? "text-red-600" : "text-green-600"}`}>
                          {row.amount - (row.budget || 0) >= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          <div className="text-xs">{row.budget ? `${(((row.amount - row.budget) / (row.budget || 1)) * 100).toFixed(1)}%` : "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold">{percentage.toFixed(0)}%</div>
                    {isOver && <div className="text-xs font-medium text-red-600">Over budget</div>}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 overflow-hidden bg-gray-200 rounded-full">
                  <div className={`h-full transition-all duration-500 ${isOver ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${percentage}%` }} />
                </div>

                {/* Inline edit for budget */}
                <div className="flex items-center justify-end gap-2 mt-2">
                  {editing[row.category] ? (
                    <>
                      <input className="w-32 px-2 py-1 text-sm text-right border rounded" value={draftBudgets[row.category] ?? ""} onChange={(e) => setDraftBudgets((d) => ({ ...d, [row.category]: e.target.value }))} inputMode="numeric" />
                      <button className="flex items-center gap-2 px-3 py-1 text-sm text-white bg-green-600 rounded" onClick={() => saveBudget(row.category)} disabled={savingCategory === row.category}>
                        {savingCategory === row.category ? (
                          "Saving..."
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Save
                          </>
                        )}
                      </button>

                      <button className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-200 rounded" onClick={() => cancelEdit(row.category)}>
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </>
                  ) : (
                    <Button className="flex items-center gap-2 px-3 py-1 text-sm" onClick={() => startEdit(row.category)}>
                      <Edit2 className="w-4 h-4" /> Edit Budget
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!showAll && rows.length > 5 && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => setShowAll(true)}>
              View All
            </Button>
          </div>
        )}

        {showAll && rows.length > 5 && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => setShowAll(false)}>
              Show Less
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
