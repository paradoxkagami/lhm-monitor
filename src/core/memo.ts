import { createElement, Component } from 'preact'
import type { FunctionalComponent } from 'preact'

function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  if (a === b) return true
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const key of keysA) {
    if (a[key] !== b[key]) return false
  }
  return true
}

type Comparer<P> = (prev: P, next: P) => boolean

export function memo<P>(
  c: FunctionalComponent<P>,
  comparer?: Comparer<P>,
): FunctionalComponent<P> {
  const compare = comparer ?? (shallowEqual as Comparer<P>)

  class Memoed extends Component<P> {
    shouldComponentUpdate(nextProps: P) {
      return !compare(this.props, nextProps)
    }

    render() {
      return createElement(c, this.props)
    }
  }

  Memoed.displayName = 'Memo(' + (c.displayName || c.name || 'Anonymous') + ')'
  return Memoed as unknown as FunctionalComponent<P>
}