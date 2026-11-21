import { autoPairSyntaxFeature } from './syntax/feature';
import type { MkdextFeature } from '../types';

/** 输入 `(` / `[` 自动补右括号；空对里退格一次删两字符。 */
export const autoPairFeature: MkdextFeature = {
  id: 'autoPair',
  register: ({ editor }) => [editor.registerSyntaxFeature(autoPairSyntaxFeature)],
};
