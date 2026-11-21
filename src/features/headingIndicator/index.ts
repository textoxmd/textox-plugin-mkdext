import './heading-type-indicator.css';

import { headingTypeIndicatorSyntaxFeature } from './syntax/feature';
import type { MkdextFeature } from '../types';

/** 光标所在标题旁显示 H1–H6 角标（节点装饰 + CSS `::before`）。 */
export const headingIndicatorFeature: MkdextFeature = {
  id: 'headingIndicator',
  register: ({ editor }) => [editor.registerSyntaxFeature(headingTypeIndicatorSyntaxFeature)],
};
