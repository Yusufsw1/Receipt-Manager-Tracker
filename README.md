# 🧾 AI-Powered Receipt Manager & Tracker

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini_AI-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

**Receipt Manager & Tracker** is an intelligent expense management system that integrates **Google Gemini AI** to automate financial data entry. By leveraging Large Language Models (LLM), the app doesn't just read text—it understands the receipt structure to provide highly accurate expense tracking.

## 🧠 AI Features (Google Gemini Integration)

- **Semantic OCR Extraction**: Unlike traditional OCR, this app uses Gemini to intelligently parse merchant names, transaction dates, and total amounts, even from complex or non-standard receipt layouts.
- **Automated Categorization**: Gemini analyzes the merchant and items purchased to automatically suggest expense categories (e.g., "Grocery", "Electronics", "Dining").
- **Multi-Currency Recognition**: Capability to detect and process various currency symbols and formats automatically through AI inference.
- **Smart Data Correction**: The AI helps fix blurry or partially unreadable text by cross-referencing context within the receipt.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI Core**: Google Gemini AI API
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **State Management**: React Server Actions & Hooks

## 📂 Architecture Overview

```text
src/
├── app/            # Next.js Server Components & AI Route Handlers
├── lib/            # Gemini AI Configuration & Supabase Client
├── components/     # AI Upload Preview & Data Visualization
└── services/       # Prompt Engineering & AI Parsing Logic
```
🚀 Getting Started
1. Clone & Install:
   ```bash
   git clone [https://github.com/Yusufsw1/Receipt-Manager-Tracker.git](https://github.com/Yusufsw1/Receipt-Manager-Tracker.git)
   npm install

2. Configure Environment Variables: Create a .env.local file:
   ```Cuplikan kode
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
     GEMINI_API_KEY=your_google_gemini_api_key

3. Run:
   ```bash
   npm run dev


💡 Innovation Focus
The integration of Gemini AI transforms a simple tracker into a powerful financial assistant. This project demonstrates proficiency in Prompt Engineering, handling AI streaming responses, and managing cloud-based relational databases.

🤝 Contact
Yusuf - https://github.com/Yusufsw1

Project Link: https://github.com/Yusufsw1/Receipt-Manager-Tracker
