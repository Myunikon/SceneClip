import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export const parseTime = (str: string) => {
    if (!str) return 0
    const parts = str.split(':').map(Number).reverse()
    let seconds = 0
    if (parts[0]) seconds += parts[0]
    if (parts[1]) seconds += parts[1] * 60
    if (parts[2]) seconds += parts[2] * 3600
    return seconds
}

export const formatRange = (range: string) => {
    if (!range || range === 'Full') return range
    const [start, end] = range.split('-').map(s => parseInt(s.trim()))
    if (isNaN(start) || isNaN(end)) return range
    return `${formatTime(start)} - ${formatTime(end)}`
}

export const parseSize = (sizeStr: string): number => {
    if (!sizeStr) return 0
    const str = sizeStr.toUpperCase().replace(/,/g, '') // Remove commas if any
    
    // Find basic number
    const match = str.match(/([0-9.]+)\s*([A-Z]+)/)
    if (!match) return 0
    
    const val = parseFloat(match[1])
    const unit = match[2]
    
    // Find power
    // Simple fallback: check standard units
    let power = 0
    if (unit.includes('KB') || unit.includes('K')) power = 1
    if (unit.includes('MB') || unit.includes('M')) power = 2
    if (unit.includes('GB') || unit.includes('G')) power = 3
    if (unit.includes('TB') || unit.includes('T')) power = 4
    
    return val * Math.pow(1024, power)
}
