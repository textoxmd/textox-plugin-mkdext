// markdown-it-sub 不自带类型声明，DefinitelyTyped 也没有。
declare module 'markdown-it-sub' {
  import type { PluginSimple } from 'markdown-it';

  const plugin: PluginSimple;
  export default plugin;
}
