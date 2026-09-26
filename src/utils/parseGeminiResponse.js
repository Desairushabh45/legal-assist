/**
 * Safely parses a response string from Gemini that is expected to be a JSON array of analyzed clauses.
 * Strips markdown code fences (```json ... ``` or ``` ... ```) if present.
 *
 * @param {string} rawResponse - The raw text response from the Gemini API.
 * @returns {Array<{clauseText: string, riskLevel: 'low'|'medium'|'high', explanation: string, suggestedQuestion: string}>}
 * @throws {Error} If parsing fails or the content is not a valid clause analysis array.
 */
export function parseGeminiResponse(rawResponse) {
  if (!rawResponse || typeof rawResponse !== 'string') {
    throw new Error('Invalid response: Expected non-empty string from Gemini API.');
  }

  // Trim whitespace
  let cleaned = rawResponse.trim();

  // Strip markdown code fences if present (e.g. ```json ... ``` or ``` ... ```)
  // Handles leading ```json or ``` and trailing ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // In case there is text before or after the JSON array, locate the first '[' and last ']'
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${err.message}\nRaw text received:\n${rawResponse}`
    );
  }

  // Handle case if model wrapped in an object like { clauses: [...] } or { result: [...] }
  if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null) {
    const arrayKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
    if (arrayKey) {
      parsed = parsed[arrayKey];
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      'Invalid format: Expected a JSON array of clause analyses from Gemini, but received: ' +
        typeof parsed
    );
  }

  // Validate and sanitize each clause item
  return parsed.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid clause item at index ${index}: expected an object.`);
    }

    const requiredFields = ['clauseText', 'riskLevel', 'explanation', 'suggestedQuestion'];
    for (const field of requiredFields) {
      if (item[field] === undefined || item[field] === null || String(item[field]).trim() === '') {
        throw new Error(
          `Invalid clause item at index ${index}: missing required field "${field}".`
        );
      }
    }

    const validRiskLevels = ['low', 'medium', 'high'];
    const risk = String(item.riskLevel).toLowerCase().trim();

    if (!validRiskLevels.includes(risk)) {
      throw new Error(
        `Invalid riskLevel "${item.riskLevel}" at index ${index}. Must be one of: "low", "medium", or "high".`
      );
    }

    return {
      clauseText: String(item.clauseText).trim(),
      riskLevel: risk,
      explanation: String(item.explanation).trim(),
      suggestedQuestion: String(item.suggestedQuestion).trim(),
    };
  });
}

export default parseGeminiResponse;
