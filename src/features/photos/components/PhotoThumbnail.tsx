import Image from "next/image";

import { formatPhotoCategory } from "@/lib/format";

type PhotoThumbnailProps = {
  url: string;
  title: string;
  category?: string | null;
};

const placeholderThemes: Record<string, string> = {
  exterior: "from-[#f15d34] via-[#b5311b] to-[#351311]",
  interior: "from-[#4d5359] via-[#23272c] to-[#111315]",
  engine: "from-[#818a93] via-[#3f454b] to-[#15171a]",
  tires: "from-[#7b6147] via-[#41342a] to-[#191715]",
  pump_panel: "from-[#d9472b] via-[#8d2618] to-[#2d0d09]",
  equipment: "from-[#b58a60] via-[#6f5339] to-[#241a13]",
  documents: "from-[#ece0c8] via-[#d4c5ab] to-[#a38c68]",
  ladder: "from-[#cf4324] via-[#8a2b19] to-[#29110d]",
  outriggers: "from-[#c98d4d] via-[#815329] to-[#24170f]",
  hose_storage: "from-[#cf4f31] via-[#7b2518] to-[#23100d]"
};

export function PhotoThumbnail({ url, title, category }: PhotoThumbnailProps) {
  if (!url.startsWith("placeholder:")) {
    return (
      <Image
        alt={title}
        className="aspect-[16/9] w-full object-cover"
        height={720}
        src={url}
        unoptimized
        width={1280}
      />
    );
  }

  const activeCategory = category ?? url.replace("placeholder:", "").split("-")[0];
  const gradient = placeholderThemes[activeCategory] ?? placeholderThemes.exterior;

  return (
    <div
      className={`relative flex aspect-[16/9] w-full overflow-hidden bg-gradient-to-br ${gradient} p-5 text-white`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_42%)]" />
      <div className="relative flex w-full flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-white/80">
          <span>Garage Vision</span>
          <span>AI Intake</span>
        </div>
        <div>
          <div className="mb-2 h-1.5 w-20 rounded-full bg-white/50" />
          <div className="max-w-[70%] font-display text-4xl uppercase leading-none tracking-[0.03em]">
            {formatPhotoCategory(activeCategory)}
          </div>
          <p className="mt-3 max-w-[80%] text-sm text-white/78">{title}</p>
        </div>
      </div>
    </div>
  );
}
