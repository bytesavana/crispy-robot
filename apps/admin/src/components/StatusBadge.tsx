import { Badge, type badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  // generic active/inactive
  active: 'default',
  inactive: 'outline',
  // provider verification / coverage review
  verified: 'default',
  approved: 'default',
  pending: 'outline',
  rejected: 'destructive',
  // task/request lifecycle
  draft: 'outline',
  planned: 'outline',
  awaitingvendor: 'outline',
  readyforpickup: 'secondary',
  shopping: 'secondary',
  assigned: 'secondary',
  inprogress: 'secondary',
  started: 'secondary',
  completed: 'default',
  partiallycompleted: 'secondary',
  cancelled: 'destructive',
  failed: 'destructive',
  unfulfillable: 'destructive',
  abandoned: 'destructive',
  decomposed: 'outline',
  // offer lifecycle (vendor + runner)
  forming: 'outline',
  offered: 'outline',
  accepted: 'default',
  expired: 'destructive',
}

export function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANTS[status.toLowerCase()] ?? 'outline'
  return <Badge variant={variant}>{status}</Badge>
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return <Badge variant={isActive ? 'default' : 'outline'}>{isActive ? 'Active' : 'Inactive'}</Badge>
}
