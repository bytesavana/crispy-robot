import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { ActiveBadge } from '@/components/StatusBadge'
import { useAsync } from '@/lib/hooks/useAsync'
import { listCategories } from '@/lib/api/catalog'
import { listOfferings, listProviders } from '@/lib/api/providers'

const ALL_CATEGORIES = '__all__'
const ALL_PROVIDERS = '__all__'

export function ProviderOfferingsPage() {
  const navigate = useNavigate()
  const [categoryCode, setCategoryCode] = useState(ALL_CATEGORIES)
  const [providerId, setProviderId] = useState(ALL_PROVIDERS)

  const categories = useAsync(listCategories, [])
  const providers = useAsync(() => listProviders({ kind: 'Vendor' }), [])

  const {
    data: offerings,
    loading,
    error,
  } = useAsync(
    () =>
      listOfferings({
        categoryCode: categoryCode === ALL_CATEGORIES ? undefined : categoryCode,
        providerId: providerId === ALL_PROVIDERS ? undefined : providerId,
        limit: 500,
      }),
    [categoryCode, providerId],
  )

  const categoryName = (code: string) => categories.data?.find((c) => c.code === code)?.name ?? code

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Provider Offerings</h1>
        <p className="text-sm text-muted-foreground">
          Every vendor's live price and availability for a curated catalog product — ProviderRegistry's
          ProviderOffering table. Capped at 500 rows; narrow with the filters below to see more of a category or
          vendor.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
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
        <Select value={providerId} onValueChange={setProviderId}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PROVIDERS}>All vendors</SelectItem>
            {providers.data?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {offerings && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Available</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offerings.map((o) => (
              <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(`/providers/${o.providerId}`)}>
                <TableCell className="font-medium">{o.displayName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{categoryName(o.categoryCode)}</Badge>
                </TableCell>
                <TableCell>{o.providerName}</TableCell>
                <TableCell>{o.price.toLocaleString()}</TableCell>
                <TableCell>
                  <ActiveBadge isActive={o.isAvailable} />
                </TableCell>
              </TableRow>
            ))}
            {offerings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No offerings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
