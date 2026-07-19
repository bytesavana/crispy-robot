import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { useAsync } from '@/lib/hooks/useAsync'
import { listCategories } from '@/lib/api/catalog'

export function CategoriesPage() {
  const navigate = useNavigate()
  const { data: categories, loading, error } = useAsync(listCategories, [])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Service Catalog</h1>
        <p className="text-sm text-muted-foreground">
          Read-only — ServiceCatalog has no create/update endpoints. Click a category to see its fields.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {categories && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Requires provider match</TableHead>
              <TableHead>Response timeout</TableHead>
              <TableHead>Max reassignments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow
                key={category.code}
                className="cursor-pointer"
                onClick={() => navigate(`/catalog/categories/${category.code}`)}
              >
                <TableCell className="font-medium">{category.code}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  <Badge variant={category.requiresProviderMatch ? 'default' : 'outline'}>
                    {category.requiresProviderMatch ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>{category.providerResponseTimeoutMinutes} min</TableCell>
                <TableCell>{category.maxReassignmentAttempts}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
