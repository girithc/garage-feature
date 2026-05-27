import { z } from "zod";

export const ImageAnalysisSchema = z.object({
  category: z.string(),
  categories: z.array(z.string()).min(1).max(4),
  confidence: z.number().min(0).max(1),
  caption: z.string(),
  labels: z.array(z.string()).max(12)
});

export type ImageAnalysisOutput = z.infer<typeof ImageAnalysisSchema>;
