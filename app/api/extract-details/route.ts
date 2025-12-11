// app/api/extract-details/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ocrText: string = body.ocrText ?? "";

    if (!ocrText) return new Response(JSON.stringify({ error: "ocrText missing" }), { status: 400 });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a JSON-only extractor. Extract receipt fields from the OCR text below.
Return ONLY valid JSON (no explanations). Use these keys exactly:
{
  "merchant_name": string,
  "date": "YYYY-MM-DD",
  "total_amount": number,
  "line_items": [
    { "name": string, "price": number, "quantity": number }
  ],
  "category": one of: "Food", "Transport", "Shopping", "Health", "Entertainment", "Bills", "Groceries", "Others"
}

OCR TEXT:
${ocrText}

If a value is not present exactly, make your best guess. Date must be in YYYY-MM-DD if possible. total_amount must be a number only.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text ? response.text() : "";

    // Return raw text (expecting JSON). Frontend will JSON.parse and fallback if invalid.
    return new Response(JSON.stringify({ json: text }), { status: 200 });
  } catch (err: any) {
    console.error("Extract Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Extract failed" }), { status: 500 });
  }
}
