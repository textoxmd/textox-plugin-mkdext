import type { EditorContextMenuItemMeta } from '@textox/plugin-sdk';

/** 块级公式（```math / ```latex / $$…$$）都会解析为 lang 为 latex|math 的 code_block。 */
const MATH_LANGUAGES = ['latex', 'math'];

/**
 * block 菜单项：复制公式源码。
 * 源码即 `code_block` 节点的文本（LaTeX），无需任何额外注入能力。
 */
export const mathContextMenuItem: EditorContextMenuItemMeta = {
  id: 'math.copy-latex',
  labelKey: 'math.copyLatex',
  requires: ['block'],
  order: 10,
  when: (ctx) => {
    const node = ctx.block?.node;
    return node?.type.name === 'code_block' && MATH_LANGUAGES.includes(node.attrs.lang as string);
  },
  run: (ctx) => {
    const node = ctx.block?.node;
    if (!node) return;
    return navigator.clipboard.writeText(node.textContent);
  },
};
