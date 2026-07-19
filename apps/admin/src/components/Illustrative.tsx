import { Badge } from '@/components/ui/badge'

/** Small tag for individual mocked widgets mixed in among real ones. */
export function IllustrativeTag() {
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Illustrative
    </Badge>
  )
}
