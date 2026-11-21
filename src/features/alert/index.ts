import './alert.css';

import { alertSyntaxFeature } from './feature';
import type { MkdextFeature } from '../types';

/** GitHub 风格提示框（`> [!NOTE]` 等），解析侧由 `alertSplitPlugin` 改写为 alert 节点。 */
export const alertFeature: MkdextFeature = {
  id: 'alert',
  register: ({ editor }) => [editor.registerSyntaxFeature(alertSyntaxFeature)],
};
