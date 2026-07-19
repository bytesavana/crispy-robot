import { listAllRequests } from './admin'
import { listConsumers } from './consumers'

export interface OrderRow {
  requestId: string
  taskId: string
  agentRef: string
  customerId: string
  customerName: string
  taskCode: string
  zoneName: string
  status: string
  estimatedPrice: number
  createdAt: string
}

// Backed by ServiceRequestOrchestrator's AdminController (GET /admin/requests). Consumers is
// fetched once alongside it purely to resolve customerId -> a display name; the request list
// itself needs no per-customer fetching.
export async function listAllOrders(): Promise<OrderRow[]> {
  const [requests, consumers] = await Promise.all([listAllRequests(), listConsumers()])
  const nameByCustomerId = new Map(consumers.map((c) => [c.userId, c.fullName]))

  const rows: OrderRow[] = []
  for (const request of requests) {
    for (const task of request.tasks) {
      rows.push({
        requestId: request.id,
        taskId: task.id,
        agentRef: request.agentRef,
        customerId: request.customerId,
        customerName: nameByCustomerId.get(request.customerId) ?? request.customerId,
        taskCode: task.taskCode,
        zoneName: task.zoneName,
        status: task.status,
        estimatedPrice: task.estimatedPrice,
        createdAt: task.createdAt,
      })
    }
  }

  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return rows
}
