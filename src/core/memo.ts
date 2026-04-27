import type { FunctionalComponent } from 'preact'

/**
 * 轻量标识函数 —— 直接透传组件，不做 memo。
 * 对 lhm-monitor 这个小工具而言，Preact 原生 diff 已足够高效。
 */
export function memo<P extends Record<string, any>>(
  c: FunctionalComponent<P>,
  _comparer?: (prev: P, next: P) => boolean,
): FunctionalComponent<P> {
  // 透传，保留 displayName 方便调试
  const Wrapped: FunctionalComponent<P> = (props: P) => c(props)
  Wrapped.displayName = 'Wrapped(' + (c.displayName || c.name) + ')'
  return Wrapped
}
