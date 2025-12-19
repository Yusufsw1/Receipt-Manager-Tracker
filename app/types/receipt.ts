// app/types/receipt.ts
export interface LineItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface Receipt {
  id: string;
  user_id: string;
  image_url: string;
  content: string; // raw OCR text
  merchant_name?: string;
  date?: string;
  total_amount?: number;
  line_items?: LineItem[];
  notes: string;
  category?: string;
  created_at?: string;
}
