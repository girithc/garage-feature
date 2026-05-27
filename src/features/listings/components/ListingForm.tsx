"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AssetCategorySelect } from "@/features/listings/components/AssetCategorySelect";
import type { ListingInput } from "@/features/listings/types";
import Image from "next/image";

type FormState = {
  title: string;
  assetCategory: string;
  year: string;
  make: string;
  model: string;
  location: string;
  price: string;
  description: string;
};

const initialState: FormState = {
  title: "",
  assetCategory: "engines_pumpers",
  year: "",
  make: "",
  model: "",
  location: "",
  price: "",
  description: ""
};

type ListingFormProps = {
  initialValues?: Partial<ListingInput>;
  eyebrow?: string;
  heading?: string;
  description?: string;
  submitLabel?: string;
  presetPhotoAssetPaths?: string[];
  presetPhotoUrls?: string[];
  presetOptions?: Array<{
    id: string;
    label: string;
    initialValues: Partial<ListingInput>;
    presetPhotoAssetPaths: string[];
    presetPhotoUrls: string[];
  }>;
};

function toFormState(initialValues?: Partial<ListingInput>): FormState {
  return {
    title: initialValues?.title ?? initialState.title,
    assetCategory: initialValues?.assetCategory ?? initialState.assetCategory,
    year: initialValues?.year ? String(initialValues.year) : initialState.year,
    make: initialValues?.make ?? initialState.make,
    model: initialValues?.model ?? initialState.model,
    location: initialValues?.location ?? initialState.location,
    price: initialValues?.price ? String(initialValues.price) : initialState.price,
    description: initialValues?.description ?? initialState.description
  };
}

export function ListingForm({
  initialValues,
  eyebrow = "Step 1",
  heading = "Create listing",
  description = "Start with the marketplace basics. The next step adds the messy seller photos and lets the AI turn them into structured, searchable listing data.",
  submitLabel = "Create listing & continue",
  presetPhotoAssetPaths = [],
  presetPhotoUrls = [],
  presetOptions = []
}: ListingFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resolvedPresetOptions = useMemo(
    () =>
      presetOptions.length > 0
        ? presetOptions
        : [
            {
              id: "default",
              label: "Listing",
              initialValues: initialValues ?? {},
              presetPhotoAssetPaths,
              presetPhotoUrls
            }
          ],
    [initialValues, presetOptions, presetPhotoAssetPaths, presetPhotoUrls]
  );
  const [activePresetId, setActivePresetId] = useState(resolvedPresetOptions[0]?.id ?? "default");
  const activePreset = useMemo(
    () => resolvedPresetOptions.find((option) => option.id === activePresetId) ?? resolvedPresetOptions[0],
    [activePresetId, resolvedPresetOptions]
  );
  const [form, setForm] = useState<FormState>(() =>
    toFormState(activePreset?.initialValues ?? initialValues)
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!activePreset) {
      return;
    }

    setForm(toFormState(activePreset.initialValues));
    setAdditionalFiles([]);
  }, [activePreset]);

  const additionalPreviewUrls = useMemo(
    () => additionalFiles.map((file) => URL.createObjectURL(file)),
    [additionalFiles]
  );

  useEffect(() => {
    return () => {
      additionalPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [additionalPreviewUrls]);

  const activePresetPhotoAssetPaths = activePreset?.presetPhotoAssetPaths ?? presetPhotoAssetPaths;
  const activePresetPhotoUrls = activePreset?.presetPhotoUrls ?? presetPhotoUrls;
  const displayPhotoUrls = [...activePresetPhotoUrls, ...additionalPreviewUrls];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: form.title,
          assetCategory: form.assetCategory,
          year: form.year ? Number(form.year) : null,
          make: form.make || null,
          model: form.model || null,
          location: form.location || null,
          price: form.price ? Number(form.price) : null,
          description: form.description || null,
          presetPhotoAssetPaths: activePresetPhotoAssetPaths
        })
      });

      if (!response.ok) {
        setError("Could not create listing. Please check the required fields.");
        return;
      }

      const listing = (await response.json()) as { id: string };

      if (additionalFiles.length > 0) {
        const uploadFormData = new FormData();

        additionalFiles.forEach((file) => {
          uploadFormData.append("files", file);
        });
        uploadFormData.append("deferAnalysis", "true");

        const uploadResponse = await fetch(`/api/listings/${listing.id}/photos`, {
          method: "POST",
          body: uploadFormData
        });

        if (!uploadResponse.ok) {
          setError("Listing created, but extra images could not be attached.");
          return;
        }
      }

      router.push(`/listings/${listing.id}`);
    } catch {
      setError("Could not create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-steel">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-none tracking-[0.03em] text-ink">
            {heading}
          </h1>
        </div>
        {description ? <p className="max-w-xl text-sm leading-6 text-steel">{description}</p> : null}
      </div>

      {resolvedPresetOptions.length > 1 ? (
        <div className="mb-8 flex flex-wrap gap-3">
          {resolvedPresetOptions.map((option) => (
            <button
              className={`rounded-[12px] border px-4 py-2 text-sm font-semibold transition ${
                option.id === activePresetId
                  ? "border-ember bg-ember text-white"
                  : "border-ink/12 bg-white text-ink hover:border-ink/20"
              }`}
              key={option.id}
              onClick={() => setActivePresetId(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-ink">Title</label>
          <Input
            placeholder="2016 Pierce Velocity Rescue Pumper"
            required
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink">Asset category</label>
          <AssetCategorySelect
            value={form.assetCategory}
            onChange={(value) => setForm((current) => ({ ...current, assetCategory: value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink">Year</label>
          <Input
            placeholder="2016"
            type="number"
            value={form.year}
            onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink">Make</label>
          <Input
            placeholder="Pierce"
            value={form.make}
            onChange={(event) => setForm((current) => ({ ...current, make: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink">Model</label>
          <Input
            placeholder="Velocity"
            value={form.model}
            onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink">Location</label>
          <Input
            placeholder="Worcester, MA"
            value={form.location}
            onChange={(event) =>
              setForm((current) => ({ ...current, location: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-ink">Price</label>
          <Input
            placeholder="345000"
            type="number"
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-ink">Description</label>
          <textarea
            className="min-h-36 w-full rounded-[14px] border border-ink/12 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-steel focus:border-ember focus:ring-2 focus:ring-ember/20"
            placeholder="Add listing context, service history, body style, or installed equipment."
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
        </div>

        {displayPhotoUrls.length > 0 ? (
          <div className="space-y-4 md:col-span-2 pt-2">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {displayPhotoUrls.map((photoUrl, index) => (
                <div
                  className="overflow-hidden rounded-[12px] border border-ink/10 bg-white"
                  key={photoUrl}
                >
                  <Image
                    alt={`Attached listing photo ${index + 1}`}
                    className="h-36 w-full object-cover"
                    height={320}
                    src={photoUrl}
                    unoptimized
                    width={480}
                  />
                </div>
              ))}
              <button
                className="flex h-36 w-full items-center justify-center rounded-[12px] border border-dashed border-ink/14 bg-sand/55 text-center transition hover:border-ember/40 hover:bg-sand"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <div>
                  <div className="font-display text-4xl uppercase leading-none text-ink">+</div>
                  <div className="mt-2 text-sm font-semibold text-steel">Add image</div>
                </div>
              </button>
            </div>
            <input
              accept="image/*"
              className="hidden"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);

                if (files.length === 0) {
                  return;
                }

                setAdditionalFiles((current) => [...current, ...files]);
                event.target.value = "";
              }}
              ref={fileInputRef}
              type="file"
            />
          </div>
        ) : null}

        <div className="md:col-span-2 flex items-center justify-between gap-4 pt-4">
          <div className="text-sm text-rust">{error}</div>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
