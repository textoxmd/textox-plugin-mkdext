// markdown-it-emoji ships a `lib/data/full.mjs` with the full shortcode
// → glyph map. The package has no .d.ts for it; declare a minimal
// shape so the emoji feature can import it without `any`.
declare module "markdown-it-emoji/lib/data/full.mjs" {
  const data: Record<string, string>;
  export default data;
}

// `markdown-it-emoji` v3 exports three factory variants (`bare` / `light` /
// `full`), each a markdown-it plugin with the same options. The package has
// no .d.ts; declare the minimal shape the emoji feature needs.
declare module "markdown-it-emoji" {
  import type { PluginWithOptions } from "markdown-it";

  type EmojiOptions = {
    defs?: Record<string, string>;
    shortcuts?: Record<string, string>;
    enabled?: string[];
  };

  export const bare: PluginWithOptions<EmojiOptions>;
  export const light: PluginWithOptions<EmojiOptions>;
  export const full: PluginWithOptions<EmojiOptions>;
}
