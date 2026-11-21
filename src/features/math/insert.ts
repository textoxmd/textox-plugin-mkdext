import type { IconDef, InsertCommandMeta } from '@textox/plugin-sdk';

const mathIcon: IconDef = [['path', 'M18 7V4H6l6 8-6 8h12v-3']];

export const mathInsert: InsertCommandMeta = {
  // 裸 slug：宿主按 id 去重，且须与原生菜单项 / 快捷键 / 命令分发的 action id 一致。
  id: 'math_block',
  keyword: 'math',
  labelKey: 'math.mathBlock',
  descriptionKey: 'math.mathBlockDesc',
  icon: mathIcon,
  defaultShortcut: 'Cmd+Shift+M',
  category: 'paragraph',
  order: 3,
  insert(view) {
    const schema = view.state.schema;
    const codeBlock = schema.nodes.code_block;
    if (!codeBlock) return;
    const { $from } = view.state.selection;
    const tr = view.state.tr.replaceWith(
      $from.before(),
      $from.after(),
      codeBlock.create({ lang: 'latex' }),
    );
    view.dispatch(tr);
    view.focus();
  },
};
