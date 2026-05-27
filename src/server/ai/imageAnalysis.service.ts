import { readFile } from "node:fs/promises";
import path from "node:path";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import type { PhotoAnalysis } from "@/features/photos/types";
import { AppError } from "@/lib/errors";
import { buildImageAnalysisPrompt } from "@/server/ai/prompts";
import { ImageAnalysisSchema } from "@/server/ai/schemas";
import {
  getAllowedPhotoCategories,
  getPrimaryPhotoCategory,
  normalizePhotoCategories,
  normalizePhotoCategory
} from "@/server/taxonomy/taxonomy.service";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const mimeTypeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

async function resolveLocalImageDataUrl(imageUrl: string) {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  let filePath: string | null = null;

  if (imageUrl.startsWith("/uploads/")) {
    filePath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
  } else if (imageUrl.startsWith("/api/demo-assets/")) {
    const assetPath = imageUrl.replace("/api/demo-assets/", "");
    filePath = path.join(process.cwd(), "assets", assetPath);
  }

  if (!filePath) {
    return null;
  }

  const bytes = await readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = mimeTypeByExtension[extension] ?? "application/octet-stream";

  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

async function buildOpenAIAnalysis(params: {
  assetCategory: string;
  imageUrl: string;
  fileName?: string | null;
}) {
  if (!openaiClient) {
    throw new AppError("OPENAI_API_KEY is required for image analysis.", 500);
  }

  const dataUrl = await resolveLocalImageDataUrl(params.imageUrl);

  if (!dataUrl) {
    throw new AppError(`Unable to load image data for analysis: ${params.imageUrl}`, 400);
  }

  const allowedCategories = getAllowedPhotoCategories(params.assetCategory);
  const response = await openaiClient.responses.parse({
    model: "gpt-5.4-mini",
    store: false,
    instructions: buildImageAnalysisPrompt({
      assetCategory: params.assetCategory,
      allowedCategories: [...allowedCategories]
    }),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Analyze this municipal equipment listing photo."
          },
          {
            type: "input_image",
            image_url: dataUrl,
            detail: "high"
          }
        ]
      }
    ],
    text: {
      format: zodTextFormat(ImageAnalysisSchema, "image_analysis")
    }
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new AppError("Image analysis did not return structured output.", 502);
  }

  const normalized = ImageAnalysisSchema.parse(parsed);
  const categories = normalizePhotoCategories(params.assetCategory, normalized.categories);
  const category = normalizePhotoCategory(
    params.assetCategory,
    normalized.category ?? categories[0]
  );

  return {
    category: category ?? getPrimaryPhotoCategory({ predictedCategories: categories }),
    categories,
    confidence: normalized.confidence,
    caption: normalized.caption,
    labels: normalized.labels,
    aiModel: "gpt-5.4-mini",
    aiRawResponse: {
      provider: "openai",
      model: response.model,
      parsed
    }
  } satisfies PhotoAnalysis;
}

export async function analyzeImage(params: {
  assetCategory: string;
  imageUrl: string;
  fileName?: string | null;
}): Promise<PhotoAnalysis> {
  return buildOpenAIAnalysis(params);
}
