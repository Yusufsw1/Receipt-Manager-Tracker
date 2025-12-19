// lib/receipts.ts
import { createSupabaseBrowser } from "@/lib/supabase/client";

export async function uploadAndProcessReceipt(file: File) {
  const supabase = createSupabaseBrowser();

  try {
    // 1. Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // 2. Upload to storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("receipts").upload(filePath, file);

    if (uploadError) throw uploadError;

    // 3. Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("receipts").getPublicUrl(filePath);

    return { publicUrl, userId };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

export async function getReceiptById(receiptId: string) {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase.from("receipts").select("*").eq("id", receiptId).single();

  if (error) throw error;
  return data;
}
