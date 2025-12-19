import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Ambil parameter 'next' jika ada (misal user ingin kembali ke halaman spesifik)
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabase();

    // Tukar kode dengan sesi
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Jika berhasil, arahkan ke dashboard atau halaman 'next'
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Jika ada error (misal link expired), arahkan ke halaman login dengan pesan error
    return NextResponse.redirect(`${origin}/auth/login?error=Verification link expired or invalid`);
  }

  // Jika tidak ada code di URL, kembalikan ke home atau login
  return NextResponse.redirect(`${origin}/auth/login`);
}
