import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorAlert } from '@/components/ErrorAlert'
import { StatusBadge } from '@/components/StatusBadge'
import { useAsync } from '@/lib/hooks/useAsync'
import { listAllOrders } from '@/lib/api/orders'

export function OrdersOverviewPage() {
  const navigate = useNavigate()
  const { data: orders, loading, error } = useAsync(listAllOrders, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">All orders</h1>
          <p className="text-sm text-muted-foreground">Cross-customer view of recent service requests.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/requests/lookup">
            <Search className="size-4" /> Look up a request
          </Link>
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}
      {loading && <Skeleton className="h-64 w-full" />}

      {orders && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent ref</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.taskId}
                className="cursor-pointer"
                onClick={() => navigate(`/requests/${order.requestId}`)}
              >
                <TableCell className="font-mono text-xs">{order.agentRef}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.taskCode}</TableCell>
                <TableCell>{order.zoneName}</TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell>{order.estimatedPrice}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
