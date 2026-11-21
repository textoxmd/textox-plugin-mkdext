declare module 'markdown-it-footnote' {
  import { PluginSimple } from 'markdown-it';

  interface FootnoteOptions {
    htmlId?: (id: number) => string;
  }

  const footnote: PluginSimple<FootnoteOptions>;
  export default footnote;
}
