import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();

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
