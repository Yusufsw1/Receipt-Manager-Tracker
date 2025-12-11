export interface Receipt {
  image_url: any;
  id: string;
  user_id: string;
  file_url: string;
  content: string;
  created_at: string;
}

// app/types/receipt.ts
export interface LineItem {
  name: string;
  price: number;
}

export interface Receipt {
  id: string;
  user_id: string;
  file_url: string;
  content: string; // raw OCR text
  merchant_name?: string;
  date?: string;
  total_amount?: number;
  line_items?: LineItem[];
  category?: string;
  created_at?: string;
}
