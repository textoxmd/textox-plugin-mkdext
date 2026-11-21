import { subSupSyntaxFeature } from './syntax/feature';
import type { MkdextFeature } from '../types';

/** Typora 风格上下标：`~sub~` / `^sup^`，词法归 markdown-it-sub / markdown-it-sup。 */
export const subSupFeature: MkdextFeature = {
  id: 'subSup',
  register: ({ editor }) => [editor.registerSyntaxFeature(subSupSyntaxFeature)],
};
