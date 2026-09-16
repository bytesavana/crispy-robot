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

export interface CatalogProductSummaryDto {
  id: string
  categoryCode: string
  genericName: string
  brand?: string | null
  packSize?: string | null
  displayName: string
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

export type CoverageStatus = 'Pending' | 'Approved' | 'Rejected'

export type ProviderKind = 'Vendor' | 'Runner'

export interface ProviderDto {
  id: string
  name: string
  kind: ProviderKind
  fulfillmentType: string
  isActive: boolean
  verificationStatus: string
  verifiedAt?: string | null
  verificationReviewedAt?: string | null
  verificationReviewedBy?: string | null
  verificationNote?: string | null
  contactChannels: ContactChannelDto[]
  latitude?: number | null
  longitude?: number | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  coverage: ProviderCoverageDto[]
}

export interface CreateProviderRequest {
  name: string
  kind: string
  fulfillmentType: string
  contactChannels?: ContactChannelDto[]
  latitude?: number | null
  longitude?: number | null
  metadata?: Record<string, unknown>
  coverage?: AddCoverageRequest[]
}

export interface UpdateProviderRequest {
  name: string
  kind: string
  fulfillmentType: string
  contactChannels?: ContactChannelDto[]
  latitude?: number | null
  longitude?: number | null
  metadata?: Record<string, unknown>
}

export interface VerifyProviderRequest {
  status: string
  reason?: string | null
}

export interface ProviderCoverageDto {
  id: string
  zoneId: string
  zoneName: string
  categoryCode: string
  isActive: boolean
  status: CoverageStatus
  requestedAt: string
  reviewedAt?: string | null
  reviewedBy?: string | null
  reviewNote?: string | null
}

export interface AddCoverageRequest {
  zoneId?: string | null
  zoneName?: string | null
  categoryCode: string
}

export interface RejectCoverageRequest {
  reason?: string | null
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

/** A single vendor's price/availability for a curated product, hydrated with product fields —
 * ProviderRegistry's flat "provider offering" shape (its route is still named `providers/items`,
 * a holdover from before the CatalogItem -> ProviderOffering entity rename). */
export interface CatalogItemDto {
  id: string
  providerId: string
  providerName: string
  categoryCode: string
  genericName: string
  brand?: string | null
  packSize?: string | null
  displayName: string
  price: number
  isAvailable: boolean
}

// ---------- ServiceRequestOrchestrator ----------

export interface ServiceTaskLineItemDto {
  id: string
  productId: string
  offeringId: string
  providerId: string
  itemFamily: string
  displayName: string
  brand?: string | null
  packSize?: string | null
  quantity: number
  quotedUnitPrice: number
  actualUnitPrice?: number | null
  actualQuantity?: number | null
  outcome: string
  approval: string
  proposedSubstituteProductId?: string | null
  proposedSubstituteDisplayName?: string | null
  proposedSubstituteUnitPrice?: number | null
}

export interface ServiceTaskDto {
  id: string
  taskCode: string
  zoneId: string
  zoneName: string
  providerId: string
  providerName: string
  vendorSelection: string
  fieldValues: Record<string, string>
  lineItems: ServiceTaskLineItemDto[]
  estimatedPrice: number
  actualTotal?: number | null
  estimatedEtaMinutes: number
  status: string
  assignedVendorRef?: string | null
  assignedRunnerRef?: string | null
  createdAt: string
  updatedAt: string
}

export interface RequestedItemDto {
  id: string
  productId: string
  quantity: number
  pinnedProviderId?: string | null
  itemFamily: string
  displayName: string
  brand?: string | null
  packSize?: string | null
}

export interface RequestIntentDto {
  id: string
  taskCode: string
  zoneId: string
  zoneName: string
  fieldValues: Record<string, string>
  pinnedProviderId?: string | null
  items: RequestedItemDto[]
}

export interface BasketDto {
  serviceRequestId: string
  basketRevision: number
  intents: RequestIntentDto[]
}

export interface ServiceRequestDto {
  id: string
  customerId: string
  agentRef: string
  createdAt: string
  basket: BasketDto
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

/** One provider-matching attempt for a task — who it was offered to and what happened
 * (accepted/rejected/expired), distinct from the task's own status transitions. */
export interface ProviderOfferDto {
  id: string
  providerId: string
  providerName: string
  fulfillmentType: string
  attemptNumber: number
  offeredAt: string
  expiresAt: string
  status: string
  respondedAt?: string | null
}

export interface AdminServiceTaskDto extends ServiceTaskDto {
  statusEvents: ServiceTaskStatusEventDto[]
  updates: ServiceTaskUpdateDto[]
  offers: ProviderOfferDto[]
}

export interface AdminRunStopDto {
  serviceTaskId: string
  sequence: number
  isDropped: boolean
  taskCode: string
  taskStatus: string
}

/** One runner-stage offer for a whole courier run — the runner-side counterpart of
 * ProviderOfferDto, for "who was the trip offered to and what happened". */
export interface AdminRunOfferDto {
  id: string
  providerId: string
  providerName: string
  attemptNumber: number
  offeredAt: string
  expiresAt: string
  status: string
  respondedAt?: string | null
}

export interface AdminRunDto {
  id: string
  status: string
  assignedRunnerRef?: string | null
  offerAttempts: number
  createdAt: string
  updatedAt: string
  stops: AdminRunStopDto[]
  offers: AdminRunOfferDto[]
}

export interface AdminServiceRequestDto {
  id: string
  customerId: string
  agentRef: string
  createdAt: string
  basket: BasketDto
  tasks: AdminServiceTaskDto[]
  runs: AdminRunDto[]
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
