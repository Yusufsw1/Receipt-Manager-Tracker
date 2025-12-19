import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase();

  const {
    data: { session },
  } = await (await supabase).auth.getSession();

  return NextResponse.json({
    session: session,
    userId: session?.user?.id,
    hasSession: !!session,
    userEmail: session?.user?.email,
  });
}
