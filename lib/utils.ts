import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// lib/utils.ts
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const getCategoryLabel = (category: string) => {
  const categories: Record<string, string> = {
    food: "🍔 Food & Drink",
    transport: "🚗 Transport",
    shopping: "🛍️ Shopping",
    health: "💊 Health",
    entertainment: "🎬 Entertainment",
    bills: "📄 Bills & Utilities",
    groceries: "🛒 Groceries",
    others: "📦 Others",
  };
  return categories[category] || categories.others;
};

export const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    food: "bg-orange-100 text-orange-800",
    transport: "bg-blue-100 text-blue-800",
    shopping: "bg-purple-100 text-purple-800",
    health: "bg-red-100 text-red-800",
    entertainment: "bg-pink-100 text-pink-800",
    bills: "bg-cyan-100 text-cyan-800",
    groceries: "bg-green-100 text-green-800",
    others: "bg-gray-100 text-gray-800",
  };
  return colors[category] || colors.others;
};
