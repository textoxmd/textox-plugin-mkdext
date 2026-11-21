// markdown-it-sup 不自带类型声明，DefinitelyTyped 也没有。
declare module 'markdown-it-sup' {
  import type { PluginSimple } from 'markdown-it';

  const plugin: PluginSimple;
  export default plugin;
}
