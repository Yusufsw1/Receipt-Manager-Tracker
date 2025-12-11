// components/ReceiptModal.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScanLine, Loader2, CheckCircle, Upload, Camera, FileImage, X, Edit2, Save, ChevronLeft, Plus, Trash2, DollarSign, Calendar, Building2, Tag, FileText, FilePlusCorner } from "lucide-react";

import { createSupabaseBrowser } from "@/lib/supabase/client";
import { cleanjson } from "@/lib/parsejson";

interface Props {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalStep = "upload" | "processing" | "review" | "success" | "manual";

interface LineItem {
  name: string;
  price: number;
  quantity?: number;
}

export default function ReceiptModal({ userId, isOpen, onClose, onSuccess }: Props) {
  const supabase = createSupabaseBrowser();

  const [modalStep, setModalStep] = useState<ModalStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [aiJsonText, setAiJsonText] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);

  // Form data
  const [merchant, setMerchant] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [total, setTotal] = useState<number | "">("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [category, setCategory] = useState<string>("Other");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFile(null);
    setPreviewUrl("");
    setFileUrl("");
    setOcrText("");
    setAiJsonText("");
    setMerchant("");
    setDate("");
    setTotal("");
    setLineItems([]);
    setCategory("Other");
    setNotes("");
  };

  const handleClose = () => {
    if (loading) {
      if (!confirm("Processing is in progress. Are you sure you want to cancel?")) return;
    }
    onClose();
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Clear file inputs
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";

    // Auto proceed to processing
    setTimeout(() => handleProcessReceipt(), 800);
  };

  const simulateProcessing = async () => {
    const steps = [
      { label: "Uploading", duration: 800 },
      { label: "Analyzing", duration: 1200 },
      { label: "Extracting", duration: 1000 },
      { label: "Categorizing", duration: 1200 },
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingProgress(((i + 1) / steps.length) * 100);
      await new Promise((resolve) => setTimeout(resolve, steps[i].duration));
    }
  };

  const handleProcessReceipt = async () => {
    if (!file) return;

    setLoading(true);
    setModalStep("processing");

    try {
      await simulateProcessing();

      // 1. Upload to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from("receipts").upload(fileName, file);

      if (error) throw error;

      const url = supabase.storage.from("receipts").getPublicUrl(data.path).data.publicUrl;
      setFileUrl(url);

      // 2. Perform OCR
      const formData = new FormData();
      formData.append("file", file);

      const ocrResponse = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });
      const ocrData = await ocrResponse.json();
      const rawText: string = ocrData.text ?? "";
      setOcrText(rawText);

      // 3. Extract structured data
      const extractResponse = await fetch("/api/extract-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: rawText }),
      });
      const extractData = await extractResponse.json();
      const jsonRaw = extractData.json || extractData;
      setAiJsonText(jsonRaw);

      let parsed: any = null;
      try {
        parsed = JSON.parse(cleanjson(jsonRaw));
      } catch (e) {
        parsed = {
          merchant_name: "",
          date: "",
          total_amount: "",
          line_items: [],
          category: "",
          notes: "",
        };
      }

      setMerchant(parsed.merchant_name ?? "");
      // Format date if it exists
      if (parsed.date) {
        try {
          const dateObj = new Date(parsed.date);
          if (!isNaN(dateObj.getTime())) {
            setDate(dateObj.toISOString().split("T")[0]);
          } else {
            setDate(parsed.date ?? "");
          }
        } catch {
          setDate(parsed.date ?? "");
        }
      } else {
        setDate("");
      }

      setTotal(parsed.total_amount);
      setLineItems(Array.isArray(parsed.line_items) ? parsed.line_items : []);
      setCategory(parsed.category);
      setNotes(parsed.notes ?? "");

      setModalStep("review");
    } catch (error: any) {
      console.error("Processing error:", error);
      alert(`Processing failed: ${error.message || "Unknown error"}`);
      setModalStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReceipt = async () => {
    if (!fileUrl) return;
    setLoading(true);

    try {
      const payload = {
        user_id: userId,
        image_url: fileUrl,
        ocr_data: ocrText,
        merchant_name: merchant,
        date: date,
        // quantity: Number()
        total_amount: total === "" ? null : Number(total),
        line_items: lineItems,
        category,
        notes,
        // extracted_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("receipts").insert(payload);

      if (error) throw error;

      setModalStep("success");
      onSuccess?.();
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(`Save failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };
  async function handleManualSubmit() {
    const totalAmount = lineItems.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return sum + qty * price;
    }, 0);
    const { error } = await supabase.from("receipts").insert({
      user_id: userId,
      merchant_name: merchant,
      line_items: lineItems,
      total_amount: totalAmount,
      date: date,
      category,
      // created_at: date ? new Date(date).toISOString() : new Date().toISOString(),
      // optional fields
    });

    if (!error) {
      setModalStep("success");
      onSuccess?.();
    } else {
      console.error(error);
    }
  }

  // Line item helpers
  const addLineItem = () => setLineItems([...lineItems, { name: "", price: 0, quantity: 0 }]);

  const updateLineItem = (idx: number, field: keyof LineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[idx] = {
      ...newItems[idx],
      [field]: field === "price" || field === "quantity" ? Number(value || 0) : value,
    };
    setLineItems(newItems);
  };

  const removeLineItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));

  return (
    <>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Step 1: Upload */}
          {modalStep === "upload" && (
            <>
              <div className="py-4 space-y-6">
                <div className="p-8 text-center transition-colors border-2 border-dashed border-muted rounded-xl hover:border-primary/50">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Upload Receipt</h3>
                  <p className="mb-6 text-muted-foreground">Add manual or select from gallery and scan</p>

                  <div className="flex flex-col justify-center gap-4 mb-6 sm:flex-row">
                    <Button onClick={() => setModalStep("manual")} variant="outline" className="flex flex-col items-center flex-1 h-auto p-6 hover:bg-primary/5 hover:border-primary/30 group">
                      <div className="flex items-center justify-center w-12 h-12 mb-3 transition-colors rounded-full bg-primary/10 group-hover:bg-primary/20">
                        <FilePlusCorner className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium">Add Manual</span>
                    </Button>

                    <Button onClick={triggerGallery} variant="outline" className="flex flex-col items-center flex-1 h-auto p-6 hover:bg-primary/5 hover:border-primary/30 group">
                      <div className="flex items-center justify-center w-12 h-12 mb-3 transition-colors rounded-full bg-primary/10 group-hover:bg-primary/20">
                        <FileImage className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-medium">From Gallery</span>
                      <span className="mt-1 text-sm text-muted-foreground">Select existing</span>
                    </Button>
                  </div>

                  {previewUrl && (
                    <div className="mt-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="relative h-48 overflow-hidden rounded-lg bg-muted">
                            <img src={previewUrl} alt="Receipt preview" className="object-contain w-full h-full" />
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button onClick={() => setPreviewUrl("")} variant="outline" size="sm" className="flex-1">
                              Remove
                            </Button>
                            <Button onClick={handleProcessReceipt} disabled={loading} className="flex-1">
                              {loading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <ScanLine className="w-4 h-4 mr-2" />
                                  Process Receipt
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="mt-6 text-sm text-muted-foreground">
                    <p className="mb-2 font-medium">📷 Tips for best results:</p>
                    <ul className="grid grid-cols-1 gap-1 text-xs text-left md:grid-cols-2">
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                        Ensure good lighting
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                        Keep receipt flat
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                        Include all details
                      </li>
                      <li className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                        Max file size: 5MB
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
          {/* Step 2: Processing */}
          {modalStep === "processing" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  Processing Receipt
                </DialogTitle>
                <DialogDescription>Using AI to extract details from your receipt</DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-6">
                <div className="space-y-4 text-center">
                  <div className="relative inline-block">
                    <Loader2 className="w-16 h-16 animate-spin text-primary" />
                    <ScanLine className="absolute w-8 h-8 text-white transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
                  </div>

                  {/* <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processing...</span>
                      <span className="font-medium">{Math.round(processingProgress)}%</span>
                    </div>
                    <Progress value={processingProgress} className="h-2" />
                  </div> */}
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Uploading Image", done: processingProgress >= 55 },
                    { label: "Detecting Text", done: processingProgress >= 100 },
                    { label: "Extracting Data", done: processingProgress >= 150 },
                    { label: "Categorizing", done: processingProgress >= 300 },
                  ].map((step) => (
                    <div key={step.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm">{step.label}</span>
                      {step.done ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 border-2 rounded-full border-primary/50 border-t-transparent animate-spin" />}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {/* Step 3: Review */}
          {modalStep === "review" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-primary" />
                  Review & Edit
                </DialogTitle>
                <DialogDescription>Review the extracted information and make changes if needed</DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-6">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/10 to-blue-100 dark:from-primary/20 dark:to-blue-900/20 border-primary/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Data extracted successfully!</p>
                      <p className="text-sm text-muted-foreground">Review and edit before saving</p>
                    </div>
                  </div>
                </div>

                {/* Receipt Preview */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>Receipt Preview</span>
                      <Badge variant="outline">AI Processed</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fileUrl && (
                      <div className="relative h-48 mb-4 overflow-hidden rounded-lg bg-muted">
                        <img src={fileUrl} alt="Receipt" className="object-contain w-full h-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Edit Form */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="raw">Raw Data</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="merchant" className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Merchant Name
                        </Label>
                        <Input id="merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g., Starbucks, Walmart" />
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">Date (YYYY-MM-DD)</label>
                          <input type="date" className="w-full p-3 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="total" className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Total Amount
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-muted-foreground">Rp</span>
                          <Input id="total" type="number" step="0.01" value={total as any} onChange={(e) => setTotal(e.target.value === "" ? "" : Number(e.target.value))} className="pl-8" placeholder="0.00" />
                        </div>
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">Category</label>
                        <select className="w-full p-3 transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={category} onChange={(e) => setCategory(e.target.value)}>
                          <option value="Food">🍔 Food & Drink</option>
                          <option value="Transport">🚗 Transport</option>
                          <option value="Shopping">🛍️ Shopping</option>
                          <option value="Utilities">📄 Utilities</option>
                          <option value="Health">💊 Health</option>
                          <option value="Entertainment">🎬 Entertainment</option>
                          <option value="Bills">🛒 Bills</option>
                          <option value="Other">📦 Other</option>
                        </select>
                      </div>
                    </div>
                    {/* Line Items */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">Line Items</label>
                        <button onClick={addLineItem} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                          <Plus className="w-4 h-4" />
                          Add Item
                        </button>
                      </div>

                      <div className="space-y-3">
                        {lineItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              className="flex-1 p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Item name"
                              value={item.name}
                              onChange={(e) => updateLineItem(idx, "name", e.target.value)}
                            />
                            <input
                              type="number"
                              className="w-20 p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Qty"
                              value={item.quantity || 0}
                              onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                              min="1"
                            />
                            <div className="relative w-32">
                              <span className="absolute text-sm text-gray-500 left-2 top-2">Rp</span>
                              <input
                                type="number"
                                step="0.01"
                                className="w-full p-2 pl-8 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Price"
                                value={item.price as any}
                                onChange={(e) => updateLineItem(idx, "price", e.target.value)}
                              />
                            </div>
                            <button onClick={() => removeLineItem(idx)} className="p-2 text-red-600 transition-colors hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {lineItems.length === 0 && <p className="p-3 text-sm italic text-center text-gray-500 rounded-lg bg-gray-50">No line items found. Add manually if needed.</p>}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea id="notes" value={notes || ""} onChange={(e) => setNotes(e.target.value)} placeholder="Add any additional notes..." rows={3} />
                    </div>
                  </TabsContent>

                  <TabsContent value="raw" className="mt-4 space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>OCR Text</Label>
                        <ScrollArea className="h-32 p-3 border rounded-md">
                          <pre className="font-mono text-sm whitespace-pre-wrap">{ocrText || "No OCR text available"}</pre>
                        </ScrollArea>
                      </div>
                      <div className="space-y-2">
                        <Label>Extracted JSON</Label>
                        <ScrollArea className="h-32 p-3 border rounded-md">
                          <pre className="font-mono text-sm whitespace-pre-wrap">{aiJsonText || "No JSON data available"}</pre>
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setModalStep("upload")} disabled={loading}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveReceipt} disabled={loading} className="gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Receipt
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
          {modalStep === "success" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Success!
                </DialogTitle>
                <DialogDescription>Your receipt has been saved successfully</DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-6">
                <div className="space-y-4 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full dark:bg-green-900/30">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>

                  <h3 className="text-xl font-bold">Receipt Saved!</h3>
                  <p className="text-muted-foreground">Your receipt has been processed and added to your expense tracker.</p>

                  <Card className="text-left">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Merchant:</span>
                          <span className="font-medium">{merchant || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium text-green-600">Rp. {total ? Number(total).toLocaleString() : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium capitalize">{category || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Items:</span>
                          <span className="font-medium">{lineItems.length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Done
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    setModalStep("upload");
                  }}
                  className="flex-1"
                >
                  <ScanLine className="w-4 h-4 mr-2" />
                  Scan Another
                </Button>
              </div>
            </>
          )}
          {modalStep === "manual" && (
            <>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Add Receipt Manually</h2>

                <Input placeholder="Merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} />

                {/* <Input placeholder="Total Amount" type="number" value={total} onChange={(e) => setTotal(Number(e.target.value))} /> */}

                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food">🍔 Food</SelectItem>
                    <SelectItem value="Transport">🚗 Transport</SelectItem>
                    <SelectItem value="Shopping">🛍️ Shopping</SelectItem>
                    <SelectItem value="Utilities">📄 Utilities</SelectItem>
                    <SelectItem value="Health">💊 Health</SelectItem>
                    <SelectItem value="Entertainment">🎬 Entertainment</SelectItem>
                    <SelectItem value="Bills">🛒 Bills</SelectItem>
                    <SelectItem value="Other">📦 Other</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Line Items</label>
                    <button onClick={addLineItem} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {lineItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          className="flex-1 p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => updateLineItem(idx, "name", e.target.value)}
                        />
                        <input
                          type="number"
                          className="w-20 p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Qty"
                          value={item.quantity || 0}
                          onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                          min="1"
                        />
                        <div className="relative w-32">
                          <span className="absolute text-sm text-gray-500 left-2 top-2">Rp</span>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full p-2 pl-8 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Price"
                            value={item.price as any}
                            onChange={(e) => updateLineItem(idx, "price", e.target.value)}
                          />
                        </div>
                        <button onClick={() => removeLineItem(idx)} className="p-2 text-red-600 transition-colors hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {lineItems.length === 0 && <p className="p-3 text-sm italic text-center text-gray-500 rounded-lg bg-gray-50">No line items found. Add manually if needed.</p>}
                  </div>
                </div>

                <Button onClick={handleManualSubmit} className="w-full">
                  Save Receipt
                </Button>
                <Button variant="outline" onClick={() => setModalStep("upload")} disabled={loading}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
