import { request, SERVICE_REQUEST_ORCHESTRATOR_URL } from './client'
import type {
  AcceptProviderOfferRequest,
  AssignTaskRequest,
  RejectProviderOfferRequest,
  RequestRefRequest,
  ServiceRequestDto,
  TaskRefRequest,
  TaskReasonRequest,
} from '@/types/dto'

const base = SERVICE_REQUEST_ORCHESTRATOR_URL

// ServiceRequestOrchestrator checks that the resolved request belongs to the
// customer named in X-Customer-Id (RequestOwnershipException -> 403 otherwise).
// Unlike Consumers, there's no admin override header here yet — so every call
// needs the real customer id the request belongs to, not the synthetic admin
// identity used elsewhere in this app.
function customerHeader(customerId: string) {
  return { 'X-Customer-Id': customerId }
}

export function listRequests(customerId: string) {
  return request<ServiceRequestDto[]>(base, '/requests', { headers: customerHeader(customerId) })
}

export function getRequest(id: string, customerId: string) {
  return request<ServiceRequestDto>(base, `/requests/${id}`, { headers: customerHeader(customerId) })
}

export function getRequestByAgentRef(agentRef: string, customerId: string) {
  return request<ServiceRequestDto>(base, `/requests/by-agent-ref/${encodeURIComponent(agentRef)}`, {
    headers: customerHeader(customerId),
  })
}

export function confirmRequest(body: RequestRefRequest, customerId: string) {
  return request<void>(base, '/requests/confirm', { method: 'POST', body, headers: customerHeader(customerId) })
}

export function confirmTask(body: TaskRefRequest, customerId: string) {
  return request<void>(base, '/requests/tasks/confirm', { method: 'POST', body, headers: customerHeader(customerId) })
}

export function assignTask(body: AssignTaskRequest, customerId: string) {
  return request<void>(base, '/requests/tasks/assign', { method: 'POST', body, headers: customerHeader(customerId) })
}

export function startTask(body: TaskRefRequest, customerId: string) {
  return request<void>(base, '/requests/tasks/start', { method: 'POST', body, headers: customerHeader(customerId) })
}

export function completeTask(body: TaskRefRequest, customerId: string) {
  return request<void>(base, '/requests/tasks/complete', {
    method: 'POST',
    body,
    headers: customerHeader(customerId),
  })
}

export function cancelTask(body: TaskReasonRequest, customerId: string) {
  return request<void>(base, '/requests/tasks/cancel', { method: 'POST', body, headers: customerHeader(customerId) })
}

export function failTask(body: TaskReasonRequest, customerId: string) {
  return request<void>(base, '/requests/tasks/fail', { method: 'POST', body, headers: customerHeader(customerId) })
}

export function acceptOffer(body: AcceptProviderOfferRequest) {
  return request<void>(base, '/requests/tasks/offers/accept', { method: 'POST', body })
}

export function rejectOffer(body: RejectProviderOfferRequest) {
  return request<void>(base, '/requests/tasks/offers/reject', { method: 'POST', body })
}
