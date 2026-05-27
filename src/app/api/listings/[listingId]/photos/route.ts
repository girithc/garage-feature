import { NextResponse } from "next/server";

import { uploadPhotosAction } from "@/features/photos/server/photo.actions";
import { getListingPhotos } from "@/features/photos/server/photo.queries";
import { AppError } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;
  const photos = await getListingPhotos(listingId);
  return NextResponse.json(photos);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;
    const formData = await request.formData();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);
    const deferAnalysis = formData.get("deferAnalysis") === "true";
    const photos = await uploadPhotosAction({ listingId, files, deferAnalysis });
    return NextResponse.json(photos, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to upload photos." }, { status: 400 });
  }
}
