import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-blue-200 bg-blue-100/60 text-blue-800 hover:bg-blue-100',
        secondary:
          'border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200',
        destructive:
          'border-red-300 bg-red-100 text-red-800 hover:bg-red-200',
        outline: 'border-slate-300 text-slate-900 hover:bg-slate-100',
        card: 'border-0 bg-white/90 text-slate-900 px-3 py-1 text-xs font-medium',
        status: 'border-0 bg-blue-100/95 text-blue-900 px-3 py-1 text-xs font-medium',
        price: 'border-0 bg-emerald-100/95 text-emerald-900 px-3 py-1 text-xs font-medium',
        highlight: 'border-slate-200 bg-slate-50 text-slate-700 px-3 py-1.5 text-sm font-normal hover:bg-slate-100',
        detail: 'border-0 bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded font-medium capitalize',
        'detail-status': 'border-0 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded font-medium capitalize',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
