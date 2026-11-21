# textox-plugin-mkdext

Textox 的 Markdown 语法扩展插件。原先分散在宿主 `official-plugins/` 里的多个语法特性
（提示框、上下标、下划线、高亮、脚注、emoji、数学公式、HTML、front matter、目录、自动配对等）
在这里合并为**一个**外部插件，每个特性在设置里保留独立开关。

## 结构

```
plugin.config.ts        插件清单（id / 版本 / 设置字段声明）
src/index.ts            Plugin 子类：按设置装配特性，设置变化时重装
src/features/index.ts   特性清单
src/features/<id>/      单个语法特性（feature 定义 + 解析/序列化/装饰实现）
src/locales.ts          插件自带文案（注入 i18next 的 plugins 命名空间）
```

一个特性导出 `MkdextFeature`：

```ts
export const fooFeature: MkdextFeature = {
  id: 'foo',                                  // 同时是设置里的开关 key
  register: ({ editor }) => [editor.registerSyntaxFeature(fooSyntaxFeature)],
};
```

`register` 返回的 `Disposable` 会在特性被关闭或插件卸载时统一释放；`editor.register*`
内部会请求编辑器重建语法管线，所以开关切换是即时的。

## 开发

```sh
bun install
bun run build      # 产物在 dist/{main.js,manifest.json,styles.css}
bun run pack       # dist/app.textox.mkdext-<version>.zip，可直接在应用内「导入插件」
bun test
bun run typecheck
```

宿主仓库在 `plugin-sources.local.json` 里把 `app.textox.mkdext` 指向本目录即可在
`bun run app:dev` 时加载本插件（构建会读 `dist/`，所以先 `bun run build`）。

## 依赖说明（临时）

`package.json` 的 `@textox/plugin-sdk` 目前指向宿主的 vendor 子模块路径，因为 0.3.0 还没发布到 npm。
发布后改成 `^0.3.0` 并删除本地路径即可。`@textox/plugin-build` 同理（指向宿主 `packages/plugin-build`）。
