import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

/** Surfaces the real backend error string (see ApiError in lib/api/client.ts) rather than a generic failure message. */
export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="size-4" />
      <AlertTitle>Request failed</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
