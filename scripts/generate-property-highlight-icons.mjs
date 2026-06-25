import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const iconsDir = path.join(rootDir, 'components', 'icons');
const outputFile = path.join(iconsDir, 'property-highlight-icons.tsx');

const iconFiles = fs
  .readdirSync(iconsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /Icon\.tsx$/.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

if (iconFiles.length === 0) {
  throw new Error('No icon components found in components/icons.');
}

const iconNames = iconFiles.map((fileName) => fileName.replace(/\.tsx$/, ''));
const defaultIconName = iconNames.includes('GarageIcon') ? 'GarageIcon' : iconNames[0];

const imports = iconNames
  .map((iconName) => `import { ${iconName} } from '@/components/icons/${iconName}';`)
  .join('\n');

const mapEntries = iconNames.map((iconName) => `  ${iconName},`).join('\n');

const content = `// AUTO-GENERATED FILE. DO NOT EDIT.
// Run \`npm run generate:icons\` to update.

${imports}

export const PROPERTY_HIGHLIGHT_ICONS = {
${mapEntries}
} as const;

export type PropertyHighlightIconName = keyof typeof PROPERTY_HIGHLIGHT_ICONS;

const DEFAULT_PROPERTY_HIGHLIGHT_ICON: PropertyHighlightIconName = '${defaultIconName}';

export function resolvePropertyHighlightIcon(iconName: string) {
  const normalizedIconName = iconName.trim() as PropertyHighlightIconName;
  return (
    PROPERTY_HIGHLIGHT_ICONS[normalizedIconName] ??
    PROPERTY_HIGHLIGHT_ICONS[DEFAULT_PROPERTY_HIGHLIGHT_ICON]
  );
}
`;

if (!fs.existsSync(outputFile) || fs.readFileSync(outputFile, 'utf8') !== content) {
  fs.writeFileSync(outputFile, content, 'utf8');
}
