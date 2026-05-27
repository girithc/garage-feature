import { NextResponse } from "next/server";

import { correctPhotoCategoryAction } from "@/features/photos/server/photo.actions";
import { getPhoto } from "@/features/photos/server/photo.queries";
import { AppError } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const photo = await getPhoto(photoId);

  if (!photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  return NextResponse.json(photo);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    const payload = (await request.json()) as {
      correctedCategory?: string | null;
      correctedCategories?: string[] | null;
    };
    const photo = await correctPhotoCategoryAction({
      photoId,
      correctedCategory: payload.correctedCategory ?? null,
      correctedCategories: payload.correctedCategories ?? null
    });
    return NextResponse.json(photo);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to update photo." }, { status: 400 });
  }
}
