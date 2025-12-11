// // app/api/receipts/route.ts
// import { NextResponse } from "next/server";
// import { createServerSupabase } from "@/lib/supabase/server";

// export async function GET() {
//   const supabase = createServerSupabase();

//   const { data, error } = await supabase.from("receipts").select("*").order("created_at", { ascending: false });

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }

//   return NextResponse.json(data);
// }

// app/api/receipts/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabase();

  const { data: receipts, error } = await supabase.from("receipts").select("*").order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ receipts: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ receipts });
}
