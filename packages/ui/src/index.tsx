import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { Button, buttonVariants } from './button.tsx'
export { Input, Label } from './input.tsx'
export { Badge } from './badge.tsx'