export function cleanjson(str: string | null | undefined): string {
  // Jika input kosong, kembalikan string objek kosong agar JSON.parse tidak error
  if (!str) return "{}";

  return str
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}
