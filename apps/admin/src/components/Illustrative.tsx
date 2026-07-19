import { Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

/** Small tag for individual mocked widgets mixed in among real ones. */
export function IllustrativeTag() {
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Illustrative
    </Badge>
  )
}

/** Full-width banner for a page or section that is entirely mocked pending a real endpoint. */
export function IllustrativeBanner({ children }: { children: React.ReactNode }) {
  return (
    <Alert>
      <Info className="size-4" />
      <AlertTitle>Illustrative data</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
