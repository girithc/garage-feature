import { NextResponse } from "next/server";

import { analyzeListingPhotosAction, analyzeListingPhotosWithProgress } from "@/features/photos/server/photo.actions";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeSseEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        controller.close();
      };

      const send = (event: string, payload: unknown) => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(encodeSseEvent(event, payload)));
      };

      request.signal.addEventListener(
        "abort",
        () => {
          close();
        },
        { once: true }
      );

      void (async () => {
        try {
          const photos = await analyzeListingPhotosWithProgress(listingId, {
            onProgress(progress) {
              send("progress", progress);
            }
          });
          send("done", {
            listingId,
            total: photos.length,
            completed: photos.filter((photo) => photo.analysisStatus === "completed").length,
            processing: photos.filter((photo) => photo.analysisStatus === "processing").length,
            pending: photos.filter((photo) => (photo.analysisStatus ?? "pending") === "pending").length,
            failed: photos.filter((photo) => photo.analysisStatus === "failed").length,
            processed: photos.filter((photo) =>
              ["completed", "failed"].includes(photo.analysisStatus ?? "pending")
            ).length,
            photos
          });
          close();
        } catch (error) {
          const message =
            error instanceof AppError ? error.message : "Unable to analyze listing photos.";

          send("fatal", { message });
          close();
        }
      })();
    }
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream"
    }
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;
    const photos = await analyzeListingPhotosAction(listingId);
    return NextResponse.json(photos);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to analyze listing photos." }, { status: 400 });
  }
}
