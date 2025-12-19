// app/components/ReceiptList.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Trash2, Eye, FileText, MoreVertical, Calendar, Building2, DollarSign, Tag, Download, Image as ImageIcon, Copy, ChevronLeft, ChevronRight, Plus, RefreshCw, Save } from "lucide-react";
import { format } from "date-fns";
import { Receipt } from "@/app/types/receipt";
import { formatShortNumber } from "@/lib/formatNumber";
import { exportReceiptsToExcel } from "@/lib/exportExcel";
import { exportReceiptsToPDF } from "@/lib/exportPdf";

interface ReceiptListProps {
  userId: string;
  startDate: string;
  endDate: string;
}

interface LineItem {
  name: string;
  price: number;
  quantity?: number;
}

export default function ReceiptList({ userId, startDate, endDate }: ReceiptListProps) {
  const supabase = createSupabaseBrowser();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sortBy] = useState<"date" | "amount" | "created">("date");
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Edit form state
  const [editForm, setEditForm] = useState({
    merchant_name: "",
    date: "",
    total_amount: "",
    category: "",
    notes: "",
    line_items: [] as LineItem[],
  });

  const categories = ["Food", "Transport", "Shopping", "Utilities", "Health", "Entertainment", "Bills", "Other"];

  useEffect(() => {
    async function fetchReceipts() {
      try {
        const res = await fetch("/api/receipts");
        const json = await res.json();
        setReceipts(json.receipts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("receipts").select("*").eq("user_id", userId).order("created_at", { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsDetailDialogOpen(true);
  };

  const handleEditReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setEditForm({
      merchant_name: receipt.merchant_name || "",
      date: receipt.date || format(new Date(), "yyyy-MM-dd"),
      total_amount: receipt.total_amount?.toString() || "",
      category: receipt.category || "Other",
      notes: receipt.notes || "",
      line_items: Array.isArray(receipt.line_items) ? receipt.line_items : [],
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReceipt) return;

    try {
      const { error } = await supabase
        .from("receipts")
        .update({
          merchant_name: editForm.merchant_name,
          date: editForm.date,
          total_amount: editForm.total_amount === "" ? null : Number(editForm.total_amount),
          category: editForm.category,
          notes: editForm.notes,
          line_items: editForm.line_items,
        })
        .eq("id", selectedReceipt.id);

      if (error) throw error;

      // Refresh the list
      fetchReceipts();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating receipt:", error);
    }
  };

  const handleDeleteReceipt = async () => {
    if (!selectedReceipt) return;

    try {
      const { error } = await supabase.from("receipts").delete().eq("id", selectedReceipt.id);

      if (error) throw error;

      // Refresh the list
      fetchReceipts();
      setIsDeleteDialogOpen(false);
      setIsDetailDialogOpen(false);
    } catch (error) {
      console.error("Error deleting receipt:", error);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const addLineItem = () => {
    setEditForm({
      ...editForm,
      line_items: [...editForm.line_items, { name: "", price: 0, quantity: 1 }],
    });
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updatedItems = [...editForm.line_items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === "price" || field === "quantity" ? Number(value || 0) : value,
    };

    setEditForm({
      ...editForm,
      line_items: updatedItems,
    });
  };

  const removeLineItem = (index: number) => {
    setEditForm({
      ...editForm,
      line_items: editForm.line_items.filter((_, i) => i !== index),
    });
  };

  const filteredDateReceipts = receipts.filter((r) => {
    const created = new Date(r.created_at ?? "");
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && created < start) return false;
    if (end && created > end) return false;

    return true;
  });
  const sortedReceipts = [...filteredDateReceipts].sort((a, b) => {
    let aValue: number, bValue: number;

    switch (sortBy) {
      case "date":
        // Gunakan getTime() dan pastikan fallback ke 0 jika date tidak ada
        aValue = a.date ? new Date(a.date).getTime() : 0;
        bValue = b.date ? new Date(b.date).getTime() : 0;
        break;
      case "amount":
        aValue = Number(a.total_amount) || 0;
        bValue = Number(b.total_amount) || 0;
        break;
      case "created":
        aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
        bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
      default:
        aValue = 0;
        bValue = 0;
    }

    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });
  // Pagination
  const totalPages = Math.ceil(sortedReceipts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  // const paginatedReceipts = sortedReceipts.slice(startIndex, startIndex + itemsPerPage);
  const paginatedReceipts = filteredDateReceipts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Calculate statistics
  const totalSpent = filteredDateReceipts.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0);

  const receiptCount = filteredDateReceipts.length;

  // AVERAGE amount: fix error (harus cek length, bukan array > 0)
  const averageAmount = receiptCount > 0 ? totalSpent / receiptCount : 0;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Food: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      Transport: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      Shopping: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      Utilities: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      Health: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      Entertainment: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      Bills: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      Other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };
    return colors[category] || colors.Other;
  };
  console.log(selectedReceipt);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid justify-center grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{receiptCount}</div>
            {/* <p className="text-xs text-muted-foreground">All time</p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">Rp.{totalSpent ? totalSpent.toLocaleString() : "0"}</div>
            <p className="text-xs text-muted-foreground">Average: Rp.{formatShortNumber(averageAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{new Set(filteredDateReceipts.map((r) => r.category)).size}</div>
            <p className="text-xs text-muted-foreground">Unique categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Receipts</CardTitle>
          <CardDescription>Manage and view all your scanned receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col mb-6 sm:flex-row">
            <div className="flex gap-2">
              <Button onClick={() => exportReceiptsToExcel(filteredDateReceipts as any)}>Export Excel</Button>
              <Button onClick={() => exportReceiptsToPDF(filteredDateReceipts as any)}>Export PDF</Button>

              <Button variant="outline" size="icon" onClick={fetchReceipts}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Receipts Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReceipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No receipts found</p>
                      <p className="text-sm">Start by scanning your first receipt!</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReceipts.map((receipt) => (
                    <TableRow key={receipt.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{receipt.merchant_name || "Unknown Merchant"}</p>
                            {receipt.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{receipt.notes}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{receipt.date ? format(new Date(receipt.date), "MMM dd, yyyy") : "—"}</TableCell>
                      <TableCell className="font-medium">Rp.{formatShortNumber(receipt.total_amount as number) || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(receipt.category || "Other")}>
                          {receipt.category || "Other"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{receipt.created_at ? format(new Date(receipt.created_at), "MMM dd") : "N/A"}</span>
                          <span className="text-xs text-muted-foreground">{receipt.created_at ? format(new Date(receipt.created_at), "hh:mm a") : ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewReceipt(receipt)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditReceipt(receipt)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleCopyToClipboard(JSON.stringify(receipt, null, 2))}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy JSON
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedReceipt(receipt);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedReceipts.length)} of {sortedReceipts.length} receipts
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" className="w-8 h-8" onClick={() => setCurrentPage(pageNum)}>
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedReceipt && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Receipt Details
                </DialogTitle>
                <DialogDescription>View detailed information about this receipt</DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[70vh] pr-6">
                <div className="space-y-6">
                  {/* Receipt Image */}
                  {selectedReceipt.image_url && (
                    <div className="space-y-2">
                      <Label>Receipt Image</Label>

                      {/* Container dengan tinggi tetap (h-60 atau 240px) */}
                      <div className="relative flex items-center justify-center w-full overflow-hidden border h-80 rounded-xl bg-muted">
                        <Image src={selectedReceipt.image_url} alt={selectedReceipt.merchant_name || "Receipt"} fill className="object-contain p-2" sizes="(max-width: 768px) 100vw, 50vw" />
                      </div>

                      <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(selectedReceipt.image_url, "_blank")}>
                        <Download className="w-4 h-4 mr-2" />
                        Lihat Gambar Penuh
                      </Button>
                    </div>
                  )}
                  <Separator />

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Merchant
                        </Label>
                        <p className="text-sm font-medium">{selectedReceipt.merchant_name || "—"}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date
                        </Label>
                        <p className="text-sm">{selectedReceipt.date ? format(new Date(selectedReceipt.date), "MMMM dd, yyyy") : "—"}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Total Amount
                        </Label>
                        <p className="text-sm font-medium text-green-600">Rp.{selectedReceipt.total_amount?.toLocaleString() || "—"}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Category
                        </Label>
                        <Badge className={getCategoryColor(selectedReceipt.category || "Other")}>{selectedReceipt.category || "Other"}</Badge>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedReceipt.notes && (
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <div className="p-3 rounded bg-muted/50">
                          <p className="text-sm">{selectedReceipt.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Line Items */}
                    {Array.isArray(selectedReceipt.line_items) && selectedReceipt.line_items.length > 0 && (
                      <div className="space-y-2">
                        <Label>Items ({selectedReceipt.line_items.length})</Label>
                        <div className="space-y-2">
                          {selectedReceipt.line_items.map((item: LineItem, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded bg-muted/50">
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                {/* Gunakan optional chaining atau nullish coalescing */}
                                {(item.quantity ?? 0) > 1 && <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>}
                              </div>
                              <p className="text-sm font-medium">Rp.{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* OCR Content */}
                    {selectedReceipt.content && (
                      <div className="space-y-2">
                        <Label>Extracted Text</Label>
                        <div className="p-3 rounded bg-muted/50">
                          <ScrollArea className="h-32">
                            <pre className="font-mono text-sm whitespace-pre-wrap">{selectedReceipt.content}</pre>
                          </ScrollArea>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="pt-4 space-y-2 border-t">
                      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">Created At</p>
                          <p className="text-sm font-medium">{selectedReceipt.created_at ? format(new Date(selectedReceipt.created_at), "MMM dd, yyyy hh:mm a") : "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    handleEditReceipt(selectedReceipt);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Receipt Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedReceipt && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-primary" />
                  Edit Receipt
                </DialogTitle>
                <DialogDescription>Update the receipt information</DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[70vh] pr-6">
                <div className="py-4 space-y-6">
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/10 to-blue-100 dark:from-primary/20 dark:to-blue-900/20 border-primary/20">
                    <div className="flex items-center gap-3">
                      <Edit2 className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Editing: {selectedReceipt.merchant_name || "Receipt"}</p>
                        <p className="text-sm text-muted-foreground">Make changes and save to update</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="merchant_name" className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Merchant Name
                        </Label>
                        <Input id="merchant_name" value={editForm.merchant_name} onChange={(e) => setEditForm({ ...editForm, merchant_name: e.target.value })} placeholder="Enter merchant name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date" className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date
                        </Label>
                        <Input id="date" type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total_amount" className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Total Amount
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-muted-foreground">Rp</span>
                          <Input id="total_amount" type="number" step="0.01" value={editForm.total_amount} onChange={(e) => setEditForm({ ...editForm, total_amount: e.target.value })} className="pl-8" placeholder="0.00" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category" className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Category
                        </Label>
                        <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Add any additional notes..." rows={3} />
                    </div>

                    {/* Line Items Editor */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Line Items</Label>
                        <Button onClick={addLineItem} variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {editForm.line_items.length === 0 ? (
                          <div className="py-8 text-center border rounded-lg text-muted-foreground">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No line items</p>
                            <p className="text-sm">Add items manually</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {editForm.line_items.map((item, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                <Input value={item.name} onChange={(e) => updateLineItem(index, "name", e.target.value)} placeholder="Item name" className="flex-1" />
                                <Input type="number" value={item.quantity || 1} onChange={(e) => updateLineItem(index, "quantity", e.target.value)} placeholder="Qty" className="w-20" min="1" />
                                <div className="relative w-32">
                                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">Rp</span>
                                  <Input type="number" step="0.01" value={item.price} onChange={(e) => updateLineItem(index, "price", e.target.value)} placeholder="Price" className="pl-8" />
                                </div>
                                <Button onClick={() => removeLineItem(index)} variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Receipt</DialogTitle>
            <DialogDescription>Are you sure you want to delete this receipt? This action cannot be undone.</DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="p-4 rounded-lg bg-destructive/10">
              <p className="font-medium">{selectedReceipt.merchant_name || "Unknown Receipt"}</p>
              <p className="text-sm text-muted-foreground">Date: {selectedReceipt.date ? format(new Date(selectedReceipt.date), "MMM dd, yyyy") : "—"}</p>
              <p className="text-sm text-muted-foreground">Amount: Rp.{selectedReceipt.total_amount?.toLocaleString() || "—"}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteReceipt}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
