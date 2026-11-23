import { useRef, useEffect, useState } from 'react'

export type AnimatedValueProps = {
  value: string
  children: React.ReactNode
  reducedMotion?: boolean
}

export default function AnimatedValue({ value, children, reducedMotion = false }: AnimatedValueProps) {
  const prevRef = useRef(value)
  const [isVisible, setIsVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (prevRef.current !== value) {
      // Clear any pending animation so rapid ticks don't queue up strobes.
      if (timerRef.current) clearTimeout(timerRef.current)
      prevRef.current = value
      // Debounce the fade so the value must stay stable for ~1s before the
      // transition fires. This prevents per-second live ticks from strobing
      // the numbers while still animating on real value changes (pause,
      // complete, etc.) once they settle.
      timerRef.current = setTimeout(() => {
        setIsVisible(false)
        timerRef.current = setTimeout(() => setIsVisible(true), 250)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value])

  const animationClass = reducedMotion
    ? 'opacity-1 translate-y-0'
    : `transition-opacity duration-250 ease-out ${isVisible ? 'opacity-1' : 'opacity-0'} translate-y-${isVisible ? '0' : '-2'}`

  return (
    <span className={`
      inline fade-in-transition
      ${animationClass}
      tabular-nums
    `}>
      {children}
    </span>
  )
}