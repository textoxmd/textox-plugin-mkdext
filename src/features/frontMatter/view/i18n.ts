// 插件内 i18n：编辑器 NodeView 拿不到 PluginApp，故由特性装配注入翻译器；
// 未注入（如单测）时回退到英文 fallback。
type Translator = (key: string) => string | undefined;

let translator: Translator | null = null;

/** 由特性装配注入宿主翻译器（`ctx.t`）；测试可注入 mock 或置空。 */
export function setTranslator(next: Translator | null): void {
  translator = next;
}

/** 宿主在 key 缺失时原样回传的形态：`<插件 id>.<key>`。 */
const PLUGIN_ID = 'app.textox.mkdext';

/** 取 `<插件 id>.<key>` 的翻译；无翻译器或缺失时用 fallback。key 形如 `frontMatter.panelTitle`。 */
export function t(key: string, fallback: string): string {
  if (!translator) return fallback;
  const value = translator(key);
  if (!value || value === `${PLUGIN_ID}.${key}`) return fallback;
  return value;
}
