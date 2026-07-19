import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { IllustrativeBanner } from '@/components/Illustrative'
import { mockOrders } from '@/mocks/ordersMocks'

export function OrdersOverviewPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">All orders</h1>
          <p className="text-sm text-muted-foreground">Cross-customer view of recent service requests.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/requests/lookup">
            <Search className="size-4" /> Look up a real request
          </Link>
        </Button>
      </div>

      <IllustrativeBanner>
        ServiceRequestOrchestrator has no list-all-requests endpoint yet — <code>GET /requests</code> is scoped to
        one customer at a time via <code>X-Customer-Id</code>. This table uses mock data pending a real admin list
        endpoint (backend follow-up). Use &ldquo;Look up a real request&rdquo; for live data.
      </IllustrativeBanner>

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
          {mockOrders.map((order) => (
            <TableRow key={order.agentRef}>
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
        </TableBody>
      </Table>
    </div>
  )
}
