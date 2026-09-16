const DASH = '—'

export function money(value: number | null | undefined): string {
  return value == null ? DASH : value.toLocaleString()
}

export function dt(value: string | null | undefined): string {
  if (!value) return DASH
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

export function text(value: string | null | undefined): string {
  return value == null || value === '' ? DASH : value
}
