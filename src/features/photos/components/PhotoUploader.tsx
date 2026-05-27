"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Card } from "@/components/ui/Card";

type PhotoUploaderProps = {
  listingId: string;
  minimal?: boolean;
  presetPhotoUrls?: string[];
};

export function PhotoUploader({
  listingId,
  minimal = false,
  presetPhotoUrls = []
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");

  async function uploadFiles(files: FileList | null | undefined) {
    if (!files?.length) {
      return;
    }

    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      setStatus("Uploading photos and generating categories, captions, and search labels...");

      const response = await fetch(`/api/listings/${listingId}/photos`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        setStatus("Upload failed. Please try again.");
        return;
      }

      setStatus("AI analysis complete. The gallery is now grouped and searchable.");
      setSelectedFiles([]);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      router.refresh();
    } catch {
      setStatus("Upload failed. Please try again.");
    }
  }

  const content = (
    <>
      {presetPhotoUrls.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {presetPhotoUrls.map((photoUrl, index) => (
            <div
              className="overflow-hidden rounded-[12px] border border-ink/10 bg-white"
              key={photoUrl}
            >
              <Image
                alt={`Ambulance sample ${index + 1}`}
                className="h-36 w-full object-cover"
                height={320}
                src={photoUrl}
                unoptimized
                width={480}
              />
            </div>
          ))}
        </div>
      ) : null}
      {!minimal ? (
        <div className="space-y-2">
          <p className="font-display text-3xl uppercase tracking-[0.04em] text-ink">
            Upload photos
          </p>
        </div>
      ) : null}
      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-ink/16 bg-sand/60 px-6 text-center transition hover:border-ember/40 hover:bg-sand ${
          presetPhotoUrls.length > 0 ? "mt-4" : "mt-5"
        } ${
          minimal ? "min-h-32 py-8" : "min-h-40 py-10"
        }`}
      >
        <input
          className="hidden"
          multiple
          name="files"
          onChange={(event) => {
            const files = event.target.files;
            setSelectedFiles(Array.from(files ?? []).map((file) => file.name));
            void uploadFiles(files);
          }}
          ref={inputRef}
          type="file"
          accept="image/*"
        />
        <span className={`text-ink ${minimal ? "text-xl font-semibold" : "font-display text-4xl uppercase"}`}>
          Drop images here
        </span>
        <span className="mt-3 text-sm text-steel">
          Exterior, cab, engine bay, pump panel, equipment, documents.
        </span>
      </label>
      <div className="mt-5 flex flex-wrap gap-2">
        {selectedFiles.map((fileName) => (
          <span
            className="rounded-[12px] border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink"
            key={fileName}
          >
            {fileName}
          </span>
        ))}
      </div>
      {status ? <p className="mt-4 text-sm text-steel">{status}</p> : null}
    </>
  );

  if (minimal) {
    return <div>{content}</div>;
  }

  return <Card className="p-6">{content}</Card>;
}
