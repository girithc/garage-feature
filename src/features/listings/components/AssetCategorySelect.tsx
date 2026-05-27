import { ASSET_CATEGORY_OPTIONS } from "@/lib/constants";
import { Select } from "@/components/ui/Select";

type AssetCategorySelectProps = {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
};

export function AssetCategorySelect({
  name = "assetCategory",
  value,
  onChange
}: AssetCategorySelectProps) {
  return (
    <Select
      name={name}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      required
    >
      <option value="">Select an asset category</option>
      {ASSET_CATEGORY_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
