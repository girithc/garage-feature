import { readFile } from "node:fs/promises";
import path from "node:path";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import type { PhotoAnalysis } from "@/features/photos/types";
import { buildImageAnalysisPrompt } from "@/server/ai/prompts";
import { ImageAnalysisSchema } from "@/server/ai/schemas";
import {
  getAllowedPhotoCategories,
  getPrimaryPhotoCategory,
  normalizePhotoCategories,
  normalizePhotoCategory
} from "@/server/taxonomy/taxonomy.service";

const heuristics: Record<
  string,
  { category: string; caption: string; labels: string[]; keywords: string[] }
> = {
  pump_panel: {
    category: "pump_panel",
    caption:
      "Side pump control panel with gauges, valves, and hose connections on a municipal apparatus.",
    labels: ["pump panel", "gauges", "valves", "hose connections", "side controls"],
    keywords: ["pump", "panel", "gauge", "valve", "hose", "intake", "control"]
  },
  engine: {
    category: "engine",
    caption:
      "Open engine compartment showing powertrain components, hoses, and maintenance access points.",
    labels: ["engine bay", "diesel engine", "hoses", "maintenance access"],
    keywords: ["engine", "motor", "hood", "bay", "powertrain"]
  },
  interior: {
    category: "interior",
    caption:
      "Cab interior with dashboard controls, instrumentation, and front seating visible.",
    labels: ["interior dashboard", "driver cockpit", "switch panel", "front seats"],
    keywords: ["interior", "cab", "dashboard", "cockpit", "seat", "radio"]
  },
  tires: {
    category: "tires",
    caption: "Wheel and tire assembly close-up with visible tread and rim details.",
    labels: ["tires", "wheel assembly", "tread", "rim"],
    keywords: ["tire", "wheel", "rim", "axle"]
  },
  documents: {
    category: "documents",
    caption:
      "Printed listing documents or inspection paperwork photographed for marketplace review.",
    labels: ["documents", "service records", "inspection paperwork"],
    keywords: ["doc", "document", "record", "paper", "report", "pdf"]
  },
  ladder: {
    category: "ladder",
    caption:
      "Apparatus photo centered on the aerial ladder assembly and upper body equipment.",
    labels: ["truck with ladder", "aerial", "quint", "ladder assembly"],
    keywords: ["ladder", "aerial", "quint"]
  },
  outriggers: {
    category: "outriggers",
    caption:
      "Deployed stabilizer or outrigger assembly used for aerial or heavy equipment support.",
    labels: ["outriggers", "stabilizers", "support pads", "controls"],
    keywords: ["outrigger", "stabilizer", "pad", "support"]
  },
  hose_storage: {
    category: "hose_storage",
    caption: "Hose bed or hose storage area with folded line and rear access rails.",
    labels: ["hose storage", "hose bed", "supply hose", "rear access"],
    keywords: ["hose", "bed", "storage"]
  },
  equipment: {
    category: "equipment",
    caption:
      "Storage compartment or mounted gear photo highlighting accessories and department equipment.",
    labels: ["equipment compartment", "mounted tools", "nozzles", "adapters"],
    keywords: ["equipment", "tool", "compartment", "shelf", "adapter", "nozzle"]
  },
  exterior: {
    category: "exterior",
    caption:
      "Exterior listing photo showing the vehicle body, cab, side profile, and municipal apparatus layout.",
    labels: ["exterior", "side profile", "municipal truck", "crew cab"],
    keywords: ["front", "side", "rear", "exterior", "profile", "outside", "truck"]
  }
};

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const mimeTypeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

function findHeuristicCategory(fileName: string, allowedCategories: readonly string[]) {
  const normalized = fileName.toLowerCase();

  for (const heuristic of Object.values(heuristics)) {
    if (
      allowedCategories.includes(heuristic.category) &&
      heuristic.keywords.some((keyword) => normalized.includes(keyword))
    ) {
      return heuristic;
    }
  }

  return null;
}

function buildFallbackAnalysis(params: {
  fileName?: string | null;
  assetCategory: string;
  imageUrl: string;
}): PhotoAnalysis {
  const allowedCategories = getAllowedPhotoCategories(params.assetCategory);
  const baseName = path.basename(params.fileName ?? params.imageUrl).toLowerCase();
  const heuristic = findHeuristicCategory(baseName, allowedCategories);
  const category = heuristic?.category ?? allowedCategories[0] ?? "unknown";
  const labels = heuristic?.labels ?? [
    params.assetCategory.replaceAll("_", " "),
    "municipal equipment",
    "listing photo",
    category.replaceAll("_", " ")
  ];
  const caption =
    heuristic?.caption ??
    `Marketplace photo for ${params.assetCategory.replaceAll("_", " ")} focused on ${category.replaceAll("_", " ")}.`;

  return {
    category,
    categories: [category],
    confidence: heuristic ? 0.84 : 0.61,
    caption,
    labels,
    aiModel: "demo-heuristic-v1",
    aiRawResponse: {
      mode: "fallback",
      fileName: params.fileName,
      assetCategory: params.assetCategory,
      prompt: buildImageAnalysisPrompt({
        assetCategory: params.assetCategory,
        allowedCategories: [...allowedCategories]
      })
    }
  };
}

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
    return null;
  }

  const dataUrl = await resolveLocalImageDataUrl(params.imageUrl);

  if (!dataUrl) {
    return null;
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
    return null;
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
  const fallback = buildFallbackAnalysis(params);

  try {
    const openAIAnalysis = await buildOpenAIAnalysis(params);

    if (openAIAnalysis) {
      return openAIAnalysis;
    }
  } catch (error) {
    const fallbackRawResponse =
      typeof fallback.aiRawResponse === "object" && fallback.aiRawResponse !== null
        ? fallback.aiRawResponse
        : {};

    return {
      ...fallback,
      aiRawResponse: {
        ...fallbackRawResponse,
        provider: "openai",
        error: error instanceof Error ? error.message : "Unknown OpenAI error"
      }
    };
  }

  return fallback;
}
