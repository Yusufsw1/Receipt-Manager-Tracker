import Navbar from "./components/layout/Header";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { CheckCircle, BarChart3, Camera, Wallet } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section className="pt-20 pb-32 bg-gradient-to-b from-background to-muted/30">
        <div className="container flex flex-col items-center gap-12 px-6 mx-auto lg:flex-row">
          {/* LEFT CONTENT */}
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Smart Receipt Manager
              <span className="text-blue-600"> for Better Budgeting</span>
            </h1>

            <p className="max-w-xl text-lg text-muted-foreground">Track your expenses automatically with receipt scanning, budget smartly, and gain full control over your finances.</p>

            <div className="flex gap-4">
              <Button size="lg" asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="text-green-600" size={18} />
              No credit card required
            </div>
          </div>

          {/* RIGHT — MOCKUP BOX */}
          {/* <div className="flex-1">
            <div className="p-6 bg-white border shadow-xl dark:bg-neutral-900 rounded-2xl">
              <img
                src="/dashboard.png"
                alt="App Preview"
                className="w-full object-cover rounded-xl 
                  transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div> */}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-24">
        <div className="container px-6 mx-auto text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Everything You Need to Manage Your Finances</h2>

          <p className="max-w-xl mx-auto mt-3 text-muted-foreground">Powerful tools inspired by BudgetBakers & MoneyLover, designed for simplicity.</p>

          <div className="grid grid-cols-1 gap-10 mt-16 md:grid-cols-3">
            {/* Feature */}
            <div className="p-6 space-y-3 border shadow-sm rounded-xl bg-card">
              <Camera className="w-10 h-10 text-blue-600" />
              <h3 className="text-xl font-semibold">Scan Receipts</h3>
              <p className="text-muted-foreground">Automatically extract text and store receipts into categories.</p>
            </div>

            <div className="p-6 space-y-3 border shadow-sm rounded-xl bg-card">
              <BarChart3 className="w-10 h-10 text-purple-600" />
              <h3 className="text-xl font-semibold">Track Spending</h3>
              <p className="text-muted-foreground">Charts and analytics help you understand your behavior.</p>
            </div>

            <div className="p-6 space-y-3 border shadow-sm rounded-xl bg-card">
              <Wallet className="w-10 h-10 text-green-600" />
              <h3 className="text-xl font-semibold">Smart Budgeting</h3>
              <p className="text-muted-foreground">Stay under budget with alerts & category insights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-24 text-center bg-gradient-to-b from-muted/30 to-background">
        <div className="container px-6 mx-auto">
          <h2 className="text-4xl font-bold">Start Managing Your Money Better</h2>

          <p className="max-w-xl mx-auto mt-3 text-muted-foreground">Join thousands of users improving their finances with smart tracking.</p>

          <Button className="px-8 py-6 mt-8 text-lg" asChild>
            <Link href="/auth/register">Create Your Account</Link>
          </Button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-10 border-t">
        <div className="container flex justify-between px-6 mx-auto text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MyReceipts. All rights reserved.</p>

          <div className="flex gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
