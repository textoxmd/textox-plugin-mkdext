import { defineCodeBlockExtension } from '@textox/plugin-sdk';

import { mathContextMenuItem } from './context-menu';
import { mathInsert } from './insert';
import { createMathPreview } from './math-renderer';
import { mathSyntaxFeature } from './syntax/feature';
import type { MkdextFeature } from '../types';

const MATH_LANGUAGES = ['latex', 'math'];

/** 行内 / 块级 LaTeX 公式：语法特性 + 代码块预览 + 插入命令 + 「复制 LaTeX 源码」右键项。 */
export const mathFeature: MkdextFeature = {
  id: 'math',
  register: ({ editor }) => [
    editor.registerSyntaxFeature(mathSyntaxFeature),
    editor.registerExtension(
      defineCodeBlockExtension({
        id: 'math.renderer',
        languages: MATH_LANGUAGES,
        createPreview: createMathPreview,
      }),
    ),
    editor.registerInsertCommand(mathInsert),
    editor.registerContextMenuItem(mathContextMenuItem),
  ],
};
