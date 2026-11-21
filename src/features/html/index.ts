import { htmlBlock } from './syntax/block';
import { htmlComment } from './syntax/comment';
import { htmlInline } from './syntax/inline';
import { htmlMdConfig } from './syntax/md-config';
import type { MkdextFeature } from '../types';

/** GFM HTML 块 / 内联标签 / 注释；四个语法特性共同构成一个功能。 */
export const htmlFeature: MkdextFeature = {
  id: 'html',
  register: ({ editor }) => [
    editor.registerSyntaxFeature(htmlMdConfig),
    editor.registerSyntaxFeature(htmlBlock),
    editor.registerSyntaxFeature(htmlInline),
    editor.registerSyntaxFeature(htmlComment),
  ],
};
