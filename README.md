# textox-plugin-mkdext

Textox 的 Markdown 语法扩展插件——把编辑器侧 12 个语法特性装进**一个**外部插件
（`app.textox.mkdext`），逐特性开关保留在设置里。

## 为什么合并成一个插件

这些特性原先分散在宿主仓库 `official-plugins/` 下，一特性一个插件目录：各自一份
清单与构建产物、各自安装、设置面板里并列多条条目。它们的接入口径一致（都只经
`markdown-editor:extension` 注入 `SyntaxFeature` / 格式栏项 / 插入命令 / 右键项，
彼此零依赖），合并后一次安装、一个设置页分组（`editor`）即可覆盖，
装配仍按特性独立进行：`src/index.ts` 按 `FEATURES` 顺序装载启用项，任一特性
装配失败只记日志、不影响其余特性。

## 特性清单

顺序与 `src/features/index.ts` 的 `FEATURES` 一致（也就是装配顺序）。

| 特性 | 设置 key | 语法 | 贡献点 |
|------|----------|------|--------|
| `alert` 提示框 | `alert` | `> [!NOTE]`、`[!TIP]`、`[!IMPORTANT]`、`[!WARNING]`、`[!CAUTION]` | 语法特性（markdown-it 切分 + 装饰标签） |
| `subSup` 上下标 | `subSup` | `~下标~`、`^上标^` | 语法特性 |
| `underline` 下划线 | `underline` | `<u>…</u>` | 语法特性（`Mod-u`）+ 格式栏按钮 |
| `emoji` 表情符号 | `emoji` | `:smile:` 短代码 | 语法特性（源码保留短代码，装饰渲染字形） |
| `autoPair` 自动配对 | `autoPair` | 输入 `[` / `(` 自动补右括号 | 语法特性（输入规则） |
| `headingIndicator` 标题角标 | `headingIndicator` | 无语法标记 | 语法特性（装饰：光标所在标题旁显示 H1–H6） |
| `toc` 目录 | `toc` | `[toc]` / `[TOC]` | 语法特性 + 目录节点视图 |
| `highlight` 高亮 | `highlight` + `highlightColor` | `==高亮==` | 语法特性 + 格式栏按钮 + 高亮颜色设置 |
| `html` HTML | `html` | 块级 / 内联 HTML、`<!-- 注释 -->` | 4 个语法特性（markdown-it 配置 / 块 / 内联 / 注释）+ 块级节点视图 |
| `math` 数学公式 | `math` | `$…$`、`\(…\)`、`$$…$$`、围栏代码块 `latex` / `math` | 语法特性 + 代码块预览 + 右键「复制 LaTeX」+ 插入命令（`Cmd+Shift+M`） |
| `footnote` 脚注 | `footnote` | `[^1]` 引用 + `[^1]: 定义` | 语法特性 + 插入命令（`Cmd+Opt+F`）+ 定义块源文本保真 |
| `frontMatter` 文档属性 | `frontMatter` + `view` | 文档开头 `---` 包裹的 YAML 块 | 语法特性 + 属性面板节点视图（面板 / 源码两种显示） |

## 设置

`plugin.config.ts` 声明 14 个字段，全部属于 `group: 'editor'`（分组标题
`groups.editor`），`apply: 'immediate'`：

- 12 个特性开关（上表的特性 key），默认全部开启。
- `highlightColor`：高亮底色，`type: 'color'`，默认 `#f7d54e`。六个预设：
  `#f7d54e`（黄）、`#a3e07a`（绿）、`#8ec5f2`（蓝）、`#f2a0c0`（粉）、
  `#f7b267`（橙）、`#c9a7eb`（紫）。取值写入 `--highlight-color` 变量
  （亮/暗主题各一档透明度）。
- `view`：文档属性的**默认显示方式**（`panel` 属性面板 / `source` 原始 YAML），
  默认 `panel`。它是纯显示偏好，不属于特性装配——`src/index.ts` 计算设置签名时
  跳过它，改这个值不会重装特性，只切换属性块的显示方式（已打开的文档也跟着切换）。

特性开关变化时整批重装：先 `dispose` 已装配资源，再按最新配置重新 `register`
（`editor.register*` 内部会请求编辑器重建语法管线，因此切换即时生效）。

## 开发

```sh
bun install
bun run build      # 产物在 dist/{main.js,manifest.json,styles.css}
bun run typecheck  # tsc --noEmit
bunx vitest run    # 单测
bun run pack       # dist/app.textox.mkdext-<version>.zip，可直接在应用内「导入插件」
```

## 接入宿主

- 产物固定为 `dist/{main.js,manifest.json,styles.css}`；`main.js` 是单文件 bundle
  （动态 import 已内联，运行时经 blob URL 载入，裸模块只走宿主的 import map）。
- **本地开发**：在宿主仓库根建 `plugin-sources.local.json`（已 gitignore），把本仓库
  指过去即可：

  ```json
  { "app.textox.mkdext": "../textoxmd/textox-plugin-mkdext" }
  ```

  宿主构建会在该目录下依次找 `dist/<id>/`、`dist/`、目录本身，取第一个含
  `manifest.json` 的；所以改完先 `bun run build`。`bun run dev` / `bun run app:dev`
  会把三源（`plugins/*` → `vendor/plugins/*` → `plugin-sources.local.json`，
  后者覆盖前者）汇总到宿主的 `src-tauri/resources/plugins/`，本插件最终摊平在
  `src-tauri/resources/plugins/app.textox.mkdext/`。
- **安装到应用**：`bun run pack` 产出 zip（顶层目录名 = 插件 id），在
  「设置 → 插件 → 导入插件」里选它即可，安装后落到
  `<appData>/plugins/app.textox.mkdext/`。导入 ≠ 启用；安全模式下第三方插件需在
  面板里手动启用。

## 文案约定

- 设置字段的 `labelKey` / `descriptionKey` 写**裸 key**（如 `underline.label`），宿主面板会补 `<插件 id>.` 前缀。
- 编辑器贡献（`registerFormatToolbarItem` / `registerContextMenuItem` / `registerSelectionAction` /
  `registerInsertCommand`）的 `labelKey` 同样写**裸 key**，宿主桥接层统一补前缀。
- 所有文案放在 `src/locales.ts`，按 `<特性>.<字段>` 嵌套即可。

## 已知限制

- **单文件 bundle**：`plugin-build` 用 `inlineDynamicImports` 把动态 import 全部内联
  （运行时经 blob URL 载入，无法再分包），因此没有代码分割。
- **`main.js` 体积**：当前 226341 字节（约 221 KiB）。体积主要来自各特性的语法
  实现与其依赖表（如 `markdown-it-emoji` 的全量名称表、数学公式规则）；新增特性时
  注意别把大表带进主 bundle（无法按需分包）。
- **需在 WKWebView 真机冒烟**：`happy-dom` 单测覆盖不到 WebKit 的 DOM 变更判定，
  涉及属性面板 NodeView 的改动至少要真机走一遍——悬停操作区（删除整块 / 添加属性 /
  视图切换）、删除整块后的光标落点、面板 ↔ 源码切换、只读（锁定）态下按钮与输入框。

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

## 依赖说明（临时）

`package.json` 的 `@textox/plugin-sdk` 目前指向宿主的 vendor 子模块路径，因为 0.3.0 还没发布到 npm。
发布后改成 `^0.3.0` 并删除本地路径即可。`@textox/plugin-build` 同理（指向宿主 `packages/plugin-build`）。

## vendored：markdown-it-texmath

`src/features/math/syntax/vendor/texmath.js` 是 `markdown-it-texmath@1.0.0` 的逐字拷贝（MIT），
只做两处改动：去掉 `require('katex')` 兜底、CommonJS 改为 ESM（见文件头注释）。

原因：该包的 CJS 里有一句静态 `require('katex')`，Rollup 会把它变成产物的裸导入 `import ... from "katex"`。
插件由宿主经 blob URL 载入、裸模块只走 import map，而宿主不提供 `katex`（宿主自己是把 katex alias 到
stub），所以插件会在加载期直接失败。本插件的公式渲染只走宿主注入的 MathJax（`renderFormulaToSVG`），
从不使用 katex 默认渲染器，因此去掉该分支不影响行为。升级 texmath 时按同样两处改动重做拷贝即可。
