import './emoji.css';

import { emojiSyntaxFeature } from './syntax/feature';
import type { MkdextFeature } from '../types';

/** `:smile:` 短码 → emoji 字形（纯装饰，源码保持原文）。 */
export const emojiFeature: MkdextFeature = {
  id: 'emoji',
  register: ({ editor }) => [editor.registerSyntaxFeature(emojiSyntaxFeature)],
};
