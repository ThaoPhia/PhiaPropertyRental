// AUTO-GENERATED FILE. DO NOT EDIT.
// Run `npm run generate:icons` to update.

import { AirConditionIcon } from '@/components/icons/AirConditionIcon';
import { BinRecycleIcon } from '@/components/icons/BinRecycleIcon';
import { FenceIcon } from '@/components/icons/FenceIcon';
import { GarageIcon } from '@/components/icons/GarageIcon';
import { WashingMachineIcon } from '@/components/icons/WashingMachineIcon';

export const PROPERTY_HIGHLIGHT_ICONS = {
  AirConditionIcon,
  BinRecycleIcon,
  FenceIcon,
  GarageIcon,
  WashingMachineIcon,
} as const;

export type PropertyHighlightIconName = keyof typeof PROPERTY_HIGHLIGHT_ICONS;

const DEFAULT_PROPERTY_HIGHLIGHT_ICON: PropertyHighlightIconName = 'GarageIcon';

export function resolvePropertyHighlightIcon(iconName: string) {
  const normalizedIconName = iconName.trim() as PropertyHighlightIconName;
  return (
    PROPERTY_HIGHLIGHT_ICONS[normalizedIconName] ??
    PROPERTY_HIGHLIGHT_ICONS[DEFAULT_PROPERTY_HIGHLIGHT_ICON]
  );
}
