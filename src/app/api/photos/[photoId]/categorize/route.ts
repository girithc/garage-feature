import { NextResponse } from "next/server";

import { categorizePhotoAction } from "@/features/photos/server/photo.actions";
import { AppError } from "@/lib/errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params;
    const photo = await categorizePhotoAction(photoId);
    return NextResponse.json(photo);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to analyze photo." }, { status: 400 });
  }
}
