import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseGeminiResponse } from '../utils/parseGeminiResponse';

/**
 * Analyzes contract or clause text using the Google Gemini API.
 *
 * @param {string} clauseText - The contract or clause text to analyze.
 * @returns {Promise<Array<{clauseText: string, riskLevel: 'low'|'medium'|'high', explanation: string, suggestedQuestion: string}>>}
 */
export function getGeminiApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() !== '' && envKey !== 'your_gemini_api_key_here') {
    return envKey.trim();
  }
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('gemini_api_key');
    if (localKey && localKey.trim() !== '' && localKey !== 'your_gemini_api_key_here') {
      return localKey.trim();
    }
  }
  return '';
}

export function setGeminiApiKey(key) {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem('gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }
}

/**
 * Returns realistic simulated clause analysis for demo purposes
 */
export function getDemoAnalysis(clauseText) {
  const lower = (clauseText || '').toLowerCase();
  if (lower.includes('indemnif') || lower.includes('hold harmless') || lower.includes('liability')) {
    return [
      {
        clauseText: "Each party shall defend, indemnify, and hold harmless the other party and its affiliates from and against any and all claims, liabilities, losses, damages, and reasonable attorney fees arising out of any breach of this agreement, without any limitation or financial cap whatsoever.",
        riskLevel: "high",
        explanation: "This clause creates an uncapped, open-ended indemnification obligation. Without a liability cap or exclusions for indirect/consequential damages, even an inadvertent technical breach could expose your business to immense financial and legal liabilities.",
        suggestedQuestion: "Can we add a mutual liability cap tied to fees paid over the previous 12 months and exclude special or consequential damages?"
      }
    ];
  }

  if (lower.includes('non-compete') || lower.includes('competitive') || lower.includes('worldwide') || lower.includes('twenty-four')) {
    return [
      {
        clauseText: "For a period of twenty-four (24) months following termination of employment for any reason, Employee shall not directly or indirectly engage in, manage, operate, or be employed by any business that provides products or services competitive with Employer anywhere worldwide.",
        riskLevel: "high",
        explanation: "A 24-month worldwide restriction on working in your field is excessively broad and restrictive. In many jurisdictions, courts find such covenants unenforceable, but it nonetheless poses substantial litigation risks and career impediments.",
        suggestedQuestion: "Can we narrow the restriction to 6 months, restrict the geographic boundary to direct operating territories, and specify a clear list of prohibited direct competitors?"
      }
    ];
  }

  if (lower.includes('confidential') || lower.includes('intellectual property') || lower.includes('inventions')) {
    return [
      {
        clauseText: "All proprietary information disclosed under this agreement shall remain confidential indefinitely.",
        riskLevel: "medium",
        explanation: "Indefinite confidentiality is unreasonably restrictive for standard commercial disclosures. Standard market terms limit confidentiality to 2 to 5 years, reserving perpetuity solely for trade secrets.",
        suggestedQuestion: "Can we limit confidentiality protection to 3 years from receipt, while retaining indefinite protection strictly for genuine trade secrets?"
      },
      {
        clauseText: "Any intellectual property, inventions, or works conceived by Contractor during the term shall automatically become the sole property of Company without further compensation.",
        riskLevel: "high",
        explanation: "This blanket assignment transfers ownership of all inventions created during the contract term, regardless of whether they relate to the client's work or use client resources.",
        suggestedQuestion: "Can we explicitly limit IP transfer to deliverables created specifically for this engagement, ensuring Contractor retains prior works and unrelated independent creations?"
      }
    ];
  }

  return [
    {
      clauseText: clauseText.length > 250 ? clauseText.substring(0, 250) + '...' : clauseText,
      riskLevel: "medium",
      explanation: "This clause establishes binding commitments between the parties. Review whether termination rights, obligations, and remedy mechanisms are balanced for both sides.",
      suggestedQuestion: "Are the rights and obligations in this clause mutual, and what is the exact cure period before termination or penalty can be enforced?"
    }
  ];
}

/**
 * Analyzes contract or clause text using the Google Gemini API.
 *
 * @param {string} clauseText - The contract or clause text to analyze.
 * @param {string} [customApiKey] - Optional API key override.
 * @returns {Promise<Array<{clauseText: string, riskLevel: 'low'|'medium'|'high', explanation: string, suggestedQuestion: string}>>}
 */
export async function analyzeClause(clauseText, customApiKey = '') {
  const apiKey = customApiKey || getGeminiApiKey();

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'Gemini API key is not configured. Please add your VITE_GEMINI_API_KEY to the .env file in the project root.'
    );
  }

  if (!clauseText || typeof clauseText !== 'string' || clauseText.trim() === '') {
    throw new Error('Please provide valid contract or clause text to analyze.');
  }

  const genAI = new GoogleGenerativeAI(apiKey.trim());

  // Use gemini-2.5-flash as default, configurable via VITE_GEMINI_MODEL
  const modelName = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `You are an expert legal-assistance AI. Your role is to assist users by analyzing legal contracts, agreements, and clauses to clarify terms, identify liabilities, and highlight potential risks in plain language.

Analyze the following contract or clause text. Identify the key clauses or stipulations present. For each clause identified, assess its risk level for the signing party, explain its real-world implications in accessible language, and provide a practical question the user could ask a lawyer.

Return ONLY a JSON array, where each item strictly adheres to this exact structure:
[
  {
    "clauseText": "the specific clause identified from the input text",
    "riskLevel": "low",
    "explanation": "plain-language explanation of what it means and why it's risky (or not)",
    "suggestedQuestion": "a question the user could ask a lawyer about this clause"
  }
]

Requirements:
- "riskLevel" MUST be one of: "low", "medium", or "high".
- Return raw JSON only.
- Do NOT wrap in markdown code fences (do NOT use \`\`\` or \`\`\`json).
- Do NOT include any extra text, comments, markdown, or greetings before or after the JSON array.

Contract / Clause Text to Analyze:
"""
${clauseText.trim()}
"""`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  return parseGeminiResponse(responseText);
}

export default {
  analyzeClause,
  getDemoAnalysis,
  getGeminiApiKey,
  setGeminiApiKey,
};
