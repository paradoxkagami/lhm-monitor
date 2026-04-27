import { useEffect, useRef, useState } from 'preact/hooks'

export function useResizeObserver<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let rafId: number

    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const { width, height } = entries[0].contentRect
        setSize({ width, height })
      })
    })

    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [])

  return { ref, width: size.width, height: size.height }
}
