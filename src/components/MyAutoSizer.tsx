import { useState, useRef, useEffect, ReactNode } from 'react'

interface Size {
  width: number
  height: number
}

interface AutoSizerProps {
  children: (size: Size) => ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function AutoSizer({ children, className, style }: AutoSizerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setSize({ width, height })
      }
    })

    observer.observe(element)

    // Initial size
    const rect = element.getBoundingClientRect()
    setSize({ width: rect.width, height: rect.height })

    return () => observer.disconnect()
  }, [])

  return (
    <div 
        ref={ref} 
        className={className} 
        style={{ ...style, width: '100%', height: '100%', overflow: 'hidden' }}
    >
      {size.width > 0 && size.height > 0 && children(size)}
    </div>
  )
}
