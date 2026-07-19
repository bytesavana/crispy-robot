import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { useAsync } from '@/lib/hooks/useAsync'
import { getCategory } from '@/lib/api/catalog'

export function CategoryDetailPage() {
  const { code } = useParams<{ code: string }>()
  const { data: category, loading, error } = useAsync(() => getCategory(code!), [code])

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to="/catalog/categories">
          <ArrowLeft className="size-4" /> Back to categories
        </Link>
      </Button>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {category && (
        <>
          <div>
            <h1 className="font-heading text-2xl font-semibold">{category.name}</h1>
            <p className="text-sm text-muted-foreground">Code: {category.code}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Behavior</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Requires provider match</p>
                <Badge variant={category.requiresProviderMatch ? 'default' : 'outline'} className="mt-1">
                  {category.requiresProviderMatch ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Provider response timeout</p>
                <p className="mt-1 font-medium">{category.providerResponseTimeoutMinutes} min</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max reassignment attempts</p>
                <p className="mt-1 font-medium">{category.maxReassignmentAttempts}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom fields</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Data type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Help text</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.fields.map((field) => (
                    <TableRow key={field.key}>
                      <TableCell className="font-mono text-xs">{field.key}</TableCell>
                      <TableCell>{field.label}</TableCell>
                      <TableCell>{field.dataType}</TableCell>
                      <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{field.options?.join(', ') ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{field.helpText ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
