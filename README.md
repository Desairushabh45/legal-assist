# LegalAssist AI

> **Understand your contracts before you sign them**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)

---

## Overview

Legal documents, employment contracts, non-disclosure agreements (NDAs), and terms of service are notoriously dense and full of specialized legalese. For everyday individuals, freelancers, and small business owners, navigating these stipulations without costly legal counsel frequently leads to signing unfair indemnity obligations, punitive non-compete clauses, or unbounded liability terms.

**LegalAssist AI** bridges this legal accessibility gap. By simply pasting any contract clause or full agreement, users receive immediate, AI-powered risk evaluations. The application decomposes complex clauses, flags potential liabilities using intuitive color-coded risk levels (High, Medium, Low), explains legal consequences in plain everyday language, and provides targeted, practical questions to ask a lawyer before signing.

---

## Built for

Built for **Hack2Skill's PromptWars: Virtual (Exclusive Edition)** hackathon under the theme **"AI for Legal Assistance & Access"**.

---

## Features

- **Instant AI Risk Analysis**: Paste any legal snippet, agreement, or clause to receive immediate structured analysis.
- **Risk-Level Categorization**: Color-coded risk indicators (**High**, **Medium**, **Low**) with visual badges and border accents for quick vulnerability assessment.
- **Plain-Language Explanations**: Converts complex legal terms and latent obligations into clear, accessible language.
- **Targeted Lawyer Inquiries**: Generates actionable, context-aware questions you can bring directly to your legal counsel.
- **Interactive Sample Clauses & Demo Mode**: Pre-loaded with representative clauses (Indemnity & Liability, Non-Compete, Confidentiality & IP) and a one-click simulation mode to evaluate all interface capabilities instantly.
- **In-App API Key Configuration**: Configure your Google Gemini API key easily within the interface (stored securely in local browser storage) or via project environment variables.
- **Modern Responsive Dark UI**: Sleek dark-mode aesthetic built with Tailwind CSS, featuring skeleton shimmer loading states, error boundaries, and one-click clause copying.

---

## GenAI Architecture

The core generative intelligence in LegalAssist AI relies on Google's Gemini models with strict schema enforcement and defensive output parsing:

| Feature | Gemini Integration | File / Function | Description |
|---|---|---|---|
| **Clause Risk Analysis** | Gemini 2.5 Flash (`gemini-2.5-flash`), structured JSON output mode | [`src/services/geminiService.js`](src/services/geminiService.js) &rarr; `analyzeClause()` | Prompts Google Gemini with specialized legal assistance system instructions and enforces a structured JSON array schema containing `clauseText`, `riskLevel`, `explanation`, and `suggestedQuestion`. |
| **Response Validation & Sanitization** | Safe JSON parsing, fence cleaning, and schema validation | [`src/utils/parseGeminiResponse.js`](src/utils/parseGeminiResponse.js) &rarr; `parseGeminiResponse()` | Sanitizes raw AI outputs, strips markdown code fences (` ```json `), validates required keys, and verifies that `riskLevel` conforms to `"low" \| "medium" \| "high"`. |
| **Simulated Demo Engine** | Pre-structured sample clause analysis mappings | [`src/services/geminiService.js`](src/services/geminiService.js) &rarr; `getDemoAnalysis()` | Generates realistic, structured risk evaluations for sample contracts when testing without an active Gemini API key. |
| **Dynamic Key Management** | Hybrid environment and browser storage resolution | [`src/services/geminiService.js`](src/services/geminiService.js) &rarr; `getGeminiApiKey()`, `setGeminiApiKey()` | Dynamically resolves API keys from `.env` or in-app modal configuration, enabling zero-config evaluation. |

---

## Tech Stack

- **Frontend**: [React 19](https://react.dev/) & [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/), PostCSS, Autoprefixer
- **Generative AI**: [Google Gemini API](https://ai.google.dev/) (`@google/generative-ai` SDK, Gemini 2.5 Flash)
- **Testing**: [Vitest 5](https://vitest.dev/), React Testing Library, JSDOM
- **Code Quality**: [Oxlint](https://oxc.rs/)

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Desairushabh45/legal-assist.git
   cd legal-assist
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your Gemini API key (see details below). You can also configure your API key directly in the application UI without modifying `.env`.

4. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## Environment Variables

Configure these variables in your root `.env` file (refer to [`.env.example`](.env.example)):

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Yes (or via in-app UI) | Google Gemini API key (obtainable at [Google AI Studio](https://aistudio.google.com/app/apikey)) |
| `VITE_GEMINI_MODEL` | No | Target Gemini model name (defaults to `gemini-3.5-flash-lite`) |

---

## Testing

LegalAssist AI includes comprehensive unit and integration tests across the response parser, AI services, and user interface components.

Run the test suite:
```bash
npm run test
```

### Test Coverage Highlights
- **Parser & Schema Validation** ([`parseGeminiResponse.test.js`](src/utils/parseGeminiResponse.test.js)): Verifies code fence stripping, JSON bracket extraction, missing field handling, and risk level enum validation.
- **Gemini Service** ([`geminiService.test.js`](src/services/geminiService.test.js)): Tests model configuration, prompt assembly, API key checks, and exception propagation.
- **UI Components** ([`ClauseCard.test.jsx`](src/components/ClauseCard.test.jsx), [`ResultsList.test.jsx`](src/components/ResultsList.test.jsx)): Verifies risk badge styling, question presentation, and clipboard interactions.

---

## Legal Disclaimer

> **IMPORTANT NOTICE:**  
> LegalAssist AI provides automated text analysis and informational guidance for educational and assistive purposes only. **This tool does NOT provide legal advice and does not establish an attorney-client relationship.** Contract law and clause enforceability differ significantly across jurisdictions and circumstances. Never execute, modify, or terminate any legal agreement without consulting a licensed, qualified attorney in your relevant jurisdiction.

---

## License

This project is licensed under the [MIT License](LICENSE).
