export function buildImageAnalysisPrompt(params: {
  assetCategory: string;
  allowedCategories: string[];
}) {
  return `
You are analyzing photos for a municipal equipment marketplace.
Asset category: ${params.assetCategory}
Choose one primary broad photo category from this list, and optionally add a few secondary categories from the same list when they are clearly visible:
${params.allowedCategories.map((category) => `- ${category}`).join("\n")}
Also generate search-friendly labels for what is visible.
Rules:
- Use only the allowed photo categories.
- Pick the category that best describes the main subject of the image as the primary category.
- categories should include the primary category first, followed by any additional clearly relevant categories.
- Do not include more than 4 categories total.
- Do not classify condition or damage.
- Do not mention dents, rust, scratches, wear, defects, or damage.
- Labels should be short search terms, not sentences.
- If unclear, use "unknown".
- Return strict JSON only.
JSON schema:
{
  "category": string,
  "categories": string[],
  "confidence": number,
  "caption": string,
  "labels": string[]
}
`.trim();
}
