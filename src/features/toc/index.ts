import './toc.css';

import { tocSyntaxFeature } from './syntax/feature';
import type { MkdextFeature } from '../types';

/** `[toc]` 目录块：NodeView 实时列出文档内全部标题。 */
export const tocFeature: MkdextFeature = {
  id: 'toc',
  register: ({ editor }) => [editor.registerSyntaxFeature(tocSyntaxFeature)],
};
