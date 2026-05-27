export type PhotoRecord = {
  id: string;
  listingId: string;
  url: string;
  originalFileName?: string | null;
  analysisStatus?: "pending" | "processing" | "completed" | "failed";
  predictedCategory?: string | null;
  predictedCategories?: string[];
  correctedCategory?: string | null;
  correctedCategories?: string[];
  categoryConfidence?: number | null;
  caption?: string | null;
  labels: string[];
  aiModel?: string | null;
  aiRawResponse?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type PhotoAnalysis = {
  category: string;
  categories: string[];
  confidence: number;
  caption: string;
  labels: string[];
  aiModel: string;
  aiRawResponse: unknown;
};

export type PhotoAnalysisProgress = {
  listingId: string;
  total: number;
  completed: number;
  processing: number;
  pending: number;
  failed: number;
  processed: number;
};

export type PhotoAnalysisDone = PhotoAnalysisProgress & {
  photos: PhotoRecord[];
};
