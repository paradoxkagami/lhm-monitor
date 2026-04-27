import { createElement, Component } from 'preact'
import type { FunctionalComponent } from 'preact'

function shallowEqual(a: Record<string, any>, b: Record<string, any>): boolean {
  if (a === b) return true
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (a[key] !== b[key]) return false
  }
  return true
}

type Comparer = (prev: Record<string, any>, next: Record<string, any>) => boolean

export function memo<P extends Record<string, any>>(
  c: FunctionalComponent<P>,
  comparer?: Comparer,
): FunctionalComponent<P> {
  const compare = comparer ?? shallowEqual

  class Memoed extends Component<P> {
    shouldComponentUpdate(nextProps: P) {
      return !compare(this.props as Record<string, any>, nextProps as Record<string, any>)
    }

    render() {
      return createElement(c, this.props)
    }
  }

  Memoed.displayName = 'Memo(' + (c.displayName || c.name || 'Anonymous') + ')'
  return Memoed as unknown as FunctionalComponent<P>
}
