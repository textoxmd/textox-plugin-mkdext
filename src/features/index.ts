import { alertFeature } from './alert/index';
import type { MkdextFeature } from './types';

/**
 * 全部语法特性。顺序即默认装配顺序（互相独立的特性之间不敏感）。
 * 新增特性时同时补 `plugin.config.ts` 的同名 boolean 开关与文案。
 */
export const FEATURES: readonly MkdextFeature[] = [alertFeature];
