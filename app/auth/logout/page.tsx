"use client";

import { useEffect } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function LogoutPage() {
  useEffect(() => {
    const logout = async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();

      // Clear storage
      localStorage.clear();

      // Redirect ke login
      window.location.href = "/auth/login";
    };

    logout();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600">Logging out...</p>
      </div>
    </div>
  );
}
