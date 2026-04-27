import { createElement } from 'preact'
import type { FunctionalComponent } from 'preact'

function shallowDiffers(a: Record<string, any>, b: Record<string, any>): boolean {
  for (const i in a) if (i !== '__source' && !(i in b)) return true
  for (const i in b) if (i !== '__source' && a[i] !== b[i]) return true
  return false
}

/**
 * Memoize a component — 只在 props 实际变化时才重渲染。
 * 等价于 preact/compat 的 memo。
 */
export function memo<P extends Record<string, any>>(
  c: FunctionalComponent<P>,
  comparer?: (prev: P, next: P) => boolean,
): FunctionalComponent<P> {
  function shouldUpdate(this: any, nextProps: P): boolean {
    const ref = this.props.ref
    if (ref != nextProps.ref && ref) {
      typeof ref === 'function' ? ref(null) : (ref.current = null)
    }
    if (comparer) {
      return !comparer(this.props, nextProps) || ref != nextProps.ref
    }
    return shallowDiffers(this.props, nextProps)
  }

  function Memoed(this: any, props: P) {
    this.shouldComponentUpdate = shouldUpdate
    return createElement(c as any, props)
  }
  Memoed.displayName = 'Memo(' + (c.displayName || c.name) + ')'
  ;(Memoed as any)._comparer = comparer

  return Memoed as unknown as FunctionalComponent<P>
}
