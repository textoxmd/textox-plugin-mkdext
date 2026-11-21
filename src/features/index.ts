import { alertFeature } from './alert/index';
import { autoPairFeature } from './autoPair/index';
import { emojiFeature } from './emoji/index';
import { footnoteFeature } from './footnote/index';
import { frontMatterFeature } from './frontMatter/index';
import { headingIndicatorFeature } from './headingIndicator/index';
import { highlightFeature } from './highlight/index';
import { htmlFeature } from './html/index';
import { mathFeature } from './math/index';
import { subSupFeature } from './subSup/index';
import { tocFeature } from './toc/index';
import { underlineFeature } from './underline/index';
import type { MkdextFeature } from './types';

/**
 * 全部语法特性。顺序即默认装配顺序（互相独立的特性之间不敏感）。
 * 新增特性时同时补 `plugin.config.ts` 的同名 boolean 开关与文案。
 */
export const FEATURES: readonly MkdextFeature[] = [
  alertFeature,
  subSupFeature,
  underlineFeature,
  emojiFeature,
  autoPairFeature,
  headingIndicatorFeature,
  tocFeature,
  highlightFeature,
  htmlFeature,
  mathFeature,
  footnoteFeature,
  frontMatterFeature,
];
