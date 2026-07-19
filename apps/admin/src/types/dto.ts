// DTO shapes mirrored directly from the effective-happiness backend contracts
// (ServiceCatalog :5062, ProviderRegistry :5064, ServiceRequestOrchestrator :5063,
// Consumers :5065). Field names match the C# records; the services serialize
// PascalCase properties as camelCase JSON, which is what's reflected here.

// ---------- ServiceCatalog ----------

export interface ZoneDto {
  id: string
  name: string
}

export interface ServiceCategoryFieldDto {
  key: string
  label: string
  dataType: string
  required: boolean
  options?: string[] | null
  helpText?: string | null
}

export interface ServiceCategoryDto {
  code: string
  name: string
  fields: ServiceCategoryFieldDto[]
  requiresProviderMatch: boolean
  providerResponseTimeoutMinutes: number
  maxReassignmentAttempts: number
}

export interface ServiceOfferingDto {
  categoryCode: string
  categoryName: string
  basePrice: number
  baseEtaMinutes: number
}

export interface EstimateRequest {
  taskType: string
  zoneId?: string | null
  zoneName?: string | null
}

export interface EstimateResponse {
  estimatedPrice: number
  estimatedEtaMinutes: number
}

// ---------- ProviderRegistry ----------

export interface ContactChannelDto {
  type: string
  value: string
  isPrimary: boolean
}

export type VerificationStatus = 'Pending' | 'Verified' | 'Rejected'

export interface ProviderDto {
  id: string
  name: string
  fulfillmentType: string
  isActive: boolean
  verificationStatus: string
  verifiedAt?: string | null
  contactChannels: ContactChannelDto[]
  latitude?: number | null
  longitude?: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateProviderRequest {
  name: string
  fulfillmentType: string
  contactChannels?: ContactChannelDto[]
  latitude?: number | null
  longitude?: number | null
}

export interface UpdateProviderRequest {
  name: string
  fulfillmentType: string
  contactChannels?: ContactChannelDto[]
  latitude?: number | null
  longitude?: number | null
}

export interface VerifyProviderRequest {
  status: string
}

export interface ProviderCoverageDto {
  id: string
  zoneId: string
  zoneName: string
  categoryCode: string
  isActive: boolean
}

export interface AddCoverageRequest {
  zoneId?: string | null
  zoneName?: string | null
  categoryCode: string
}

export interface AddCoverageResponse {
  coverage?: ProviderCoverageDto | null
  error?: string | null
}

export interface MatchedProviderDto {
  providerId: string
  name: string
  fulfillmentType: string
  contactChannels: ContactChannelDto[]
}

// ---------- ServiceRequestOrchestrator ----------

export interface ServiceTaskDto {
  id: string
  taskCode: string
  zoneId: string
  zoneName: string
  fieldValues: Record<string, string>
  estimatedPrice: number
  estimatedEtaMinutes: number
  status: string
  assignedRunnerRef?: string | null
  createdAt: string
  updatedAt: string
}

export interface ServiceRequestDto {
  id: string
  customerId: string
  agentRef: string
  createdAt: string
  tasks: ServiceTaskDto[]
}

export interface AssignTaskRequest {
  taskId: string
  serviceRequestId?: string | null
  agentRef?: string | null
  assignedRunnerRef?: string | null
}

export interface TaskReasonRequest {
  taskId: string
  serviceRequestId?: string | null
  agentRef?: string | null
  reason?: string | null
}

export interface TaskRefRequest {
  taskId: string
  serviceRequestId?: string | null
  agentRef?: string | null
}

export interface RequestRefRequest {
  serviceRequestId?: string | null
  agentRef?: string | null
}

export interface ServiceTaskStatusEventDto {
  id: string
  fromStatus?: string | null
  toStatus: string
  reason?: string | null
  occurredAt: string
}

export interface ServiceTaskUpdateDto {
  id: string
  serviceTaskId: string
  kind: string
  activityType: string
  message: string
  occurredAt: string
}

export interface AdminServiceTaskDto extends ServiceTaskDto {
  statusEvents: ServiceTaskStatusEventDto[]
  updates: ServiceTaskUpdateDto[]
}

export interface AdminServiceRequestDto {
  id: string
  customerId: string
  agentRef: string
  createdAt: string
  tasks: AdminServiceTaskDto[]
}

export interface AcceptProviderOfferRequest {
  taskId: string
  offerId: string
}

export interface RejectProviderOfferRequest {
  taskId: string
  offerId: string
  reason?: string | null
}

// ---------- Consumers ----------

export interface ConsumerAddressDto {
  id: string
  label: string
  addressText: string
  latitude?: number | null
  longitude?: number | null
  isActive: boolean
}

export interface ConsumerDto {
  id: string
  userId: string
  fullName: string
  phone: string
  email?: string | null
  defaultZoneId?: string | null
  defaultZoneName?: string | null
  defaultPaymentMethod?: string | null
  isActive: boolean
  addresses: ConsumerAddressDto[]
  createdAt: string
  updatedAt: string
}

export interface CreateConsumerRequest {
  fullName: string
  phone: string
  email?: string | null
  zoneId?: string | null
  zoneName?: string | null
  defaultPaymentMethod?: string | null
}

export interface UpdateConsumerRequest {
  fullName: string
  email?: string | null
  zoneId?: string | null
  zoneName?: string | null
  defaultPaymentMethod?: string | null
}

export interface AddAddressRequest {
  label: string
  addressText: string
  latitude?: number | null
  longitude?: number | null
}

export interface AddAddressResponse {
  address?: ConsumerAddressDto | null
  error?: string | null
}
