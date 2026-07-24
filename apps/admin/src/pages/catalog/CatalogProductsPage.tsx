import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { useAsync } from '@/lib/hooks/useAsync'
import { listCatalogProducts, listCategories } from '@/lib/api/catalog'

const ALL_CATEGORIES = '__all__'

export function CatalogProductsPage() {
  const [categoryCode, setCategoryCode] = useState(ALL_CATEGORIES)

  const categories = useAsync(listCategories, [])
  const {
    data: products,
    loading,
    error,
  } = useAsync(() => listCatalogProducts(categoryCode === ALL_CATEGORIES ? undefined : categoryCode), [categoryCode])

  const categoryName = (code: string) => categories.data?.find((c) => c.code === code)?.name ?? code

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Catalog Products</h1>
          <p className="text-sm text-muted-foreground">
            ServiceCatalog's curated allow-list of orderable products, seeded from the category YAML files. Vendors
            offer these via ProviderRegistry's priced offerings.
          </p>
        </div>
        <Select value={categoryCode} onValueChange={setCategoryCode}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {categories.data?.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {products && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Generic name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Pack size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.displayName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{categoryName(product.categoryCode)}</Badge>
                </TableCell>
                <TableCell>{product.genericName}</TableCell>
                <TableCell>{product.brand ?? '—'}</TableCell>
                <TableCell>{product.packSize ?? '—'}</TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
