// app/api/ocr/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    // convert file -> base64 (this lib accepts inlineData)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const b64 = buffer.toString("base64");

    // model instance
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // image part per lib shape (inlineData)
    const imagePart = {
      inlineData: {
        data: b64,
        mimeType: file.type || "image/jpeg",
      },
    };

    // Compose prompt — ask plain text OCR extraction
    const prompt = "Extract all readable text from this image. Return plain text only.";

    // generate content with image inline
    const result = await model.generateContent([prompt, imagePart]);

    // result.response is a Promise-like object; .text() returns string
    const response = await result.response;
    const text = response.text ? response.text() : "";

    return new Response(JSON.stringify({ text }), { status: 200 });
  } catch (err: any) {
    console.error("OCR Error Detail:", err);
    return new Response(JSON.stringify({ error: err.message || "OCR failed" }), { status: 500 });
  }
}
