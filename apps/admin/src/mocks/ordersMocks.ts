// Illustrative-only "all orders" table. ServiceRequestOrchestrator has no
// cross-customer list-all-requests endpoint today — GET /requests is scoped to
// a single X-Customer-Id. This stands in for what a future admin list endpoint
// might return, so the Orders nav item isn't just empty.

export interface MockOrderRow {
  agentRef: string
  customerName: string
  taskCode: string
  zoneName: string
  status: string
  estimatedPrice: number
  createdAt: string
}

export const mockOrders: MockOrderRow[] = [
  { agentRef: 'AGT-3391', customerName: 'Amina Otieno', taskCode: 'grocery_run', zoneName: 'Kilimani', status: 'Completed', estimatedPrice: 850, createdAt: '2026-07-18T09:12:00Z' },
  { agentRef: 'AGT-3392', customerName: 'Brian Mwangi', taskCode: 'water_refill', zoneName: 'Westlands', status: 'InProgress', estimatedPrice: 400, createdAt: '2026-07-18T10:05:00Z' },
  { agentRef: 'AGT-3393', customerName: 'Cynthia Wafula', taskCode: 'car_wash', zoneName: 'Lavington', status: 'Assigned', estimatedPrice: 1200, createdAt: '2026-07-18T11:47:00Z' },
  { agentRef: 'AGT-3394', customerName: 'Daniel Kiptoo', taskCode: 'gas_refill', zoneName: 'Kilimani', status: 'Pending', estimatedPrice: 650, createdAt: '2026-07-19T08:20:00Z' },
  { agentRef: 'AGT-3395', customerName: 'Faith Njeri', taskCode: 'grocery_run', zoneName: 'Karen', status: 'Cancelled', estimatedPrice: 900, createdAt: '2026-07-19T09:03:00Z' },
]
