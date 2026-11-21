// `markdown-it-mark` ships no type declarations. Declare the minimal shape the
// highlight feature needs (a markdown-it plugin applied via `md.use(...)`).
declare module 'markdown-it-mark' {
  import type { PluginSimple } from 'markdown-it';

  const markPlugin: PluginSimple;
  export default markPlugin;
}
