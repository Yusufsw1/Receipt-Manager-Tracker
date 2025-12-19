"use client";

import { useState, Suspense } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import Link from "next/link";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Loader2, Eye, EyeOff, Mail, Lock, User } from "lucide-react";

function RegisterForm() {
  const supabase = createSupabaseBrowser();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validasi Dasar
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            full_name: `${form.firstName} ${form.lastName}`.trim(),
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.firstName + " " + form.lastName)}&background=random`,
          },
        },
      });

      if (signUpError) throw new Error(signUpError.message);

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md duration-300 border-0 shadow-2xl animate-in fade-in zoom-in">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Registration Successful! 🎉</CardTitle>
          <CardDescription className="text-center">Please check your email to verify your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <p className="font-medium text-green-700 dark:text-green-400">Welcome, {form.firstName}!</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Weve sent a verification email to <strong>{form.email}</strong>.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" asChild>
            <Link href="/auth/login">Go to Login Page</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
            <span className="text-2xl font-bold text-white">R</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">Create Your Account</CardTitle>
        <CardDescription className="text-center">Sign up to start managing your finances</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <div className="relative">
                <User className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                <Input id="firstName" placeholder="John" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="pl-10" required disabled={loading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <div className="relative">
                <User className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
                <Input id="lastName" placeholder="Doe" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="pl-10" disabled={loading} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10" required disabled={loading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Lock className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pl-10 pr-10"
                required
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute text-gray-400 right-3 top-3">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Lock className="absolute w-4 h-4 text-gray-400 left-3 top-3" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="pl-10 pr-10"
                required
                disabled={loading}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute text-gray-400 right-3 top-3">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
          </Button>
        </form>
      </CardContent>

      <CardFooter>
        <p className="w-full text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-blue-600">
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-zinc-950">
      <Suspense fallback={<Loader2 className="w-8 h-8 text-blue-600 animate-spin" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
