"use client";

import { DollarSign, FileText, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useEffect, useState } from "react";
import { Receipt } from "@/app/types/receipt";
import { Input } from "../ui/input";

export default function StatisticCard() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    async function fetchReceipts() {
      try {
        const res = await fetch("/api/receipts");
        const json = await res.json();
        console.log("respo Json:", json);
        setReceipts(json.receipts || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchReceipts();
  }, []);

  const totalSpent = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const receiptCount = receipts.length;
  const avgAmount = receiptCount > 0 ? totalSpent / receiptCount : 0;
  const uniqueCategories = new Set(receipts.map((r) => r.category)).size;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* total receipts */}
      <div className="flex items-center gap-3">
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[150px]" />

        <span className="text-sm text-muted-foreground">to</span>

        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[150px]" />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
          <FileText className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{receiptCount}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      {/* total spent */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <DollarSign className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp.{totalSpent ? totalSpent.toLocaleString() : "—"}</div>
          <p className="text-xs text-muted-foreground">Average: Rp.{avgAmount.toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* category count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          <Tag className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueCategories}</div>
          <p className="text-xs text-muted-foreground">Unique categories</p>
        </CardContent>
      </Card>
    </div>
  );
}
