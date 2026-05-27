import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const assetsRoot = path.join(process.cwd(), "assets");

const contentTypeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetPath: string[] }> }
) {
  const { assetPath } = await params;
  const resolvedPath = path.resolve(assetsRoot, ...assetPath);

  if (!resolvedPath.startsWith(assetsRoot)) {
    return NextResponse.json({ error: "Invalid asset path." }, { status: 400 });
  }

  try {
    const bytes = await readFile(resolvedPath);
    const extension = path.extname(resolvedPath).toLowerCase();

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentTypeByExtension[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }
}
