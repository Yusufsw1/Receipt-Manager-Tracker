import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = createServerSupabase();

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  let query = supabase.from("receipts").select("*");

  // Filter: start date
  if (start) query = query.gte("created_at", start);

  // Filter: end date
  if (end) {
    // Supabase perlu end-of-day (23:59)
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59);
    query = query.lte("created_at", endOfDay.toISOString());
  }

  query = query.order("created_at", { ascending: false });

  const { data: receipts, error } = await query;

  return NextResponse.json({ receipts });
}
