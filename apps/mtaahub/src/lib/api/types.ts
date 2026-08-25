/**
 * Wire shapes from effective-happiness, mirroring its Contracts/ records. Kept as plain types
 * rather than classes because nothing here is constructed client-side — MtaaHub only ever reads
 * these and posts back ids.
 */

/** ServiceTaskStatus — the work at one job. */
export type TaskStatus =
  | "Planned"
  | "AwaitingVendor"
  | "ReadyForPickup"
  | "Shopping"
  | "Completed"
  | "Unfulfillable"
  | "Cancelled";

/** What happened to one cart line once a runner was standing in the shop. Separate from the task's
 * status: a stop can complete fine with one line substituted and another not purchased. */
export type LineOutcome = "Expected" | "Purchased" | "Substituted" | "NotPurchased";

/** Whether a line is waiting on the customer. Only two things ever get asked — a price far enough
 * off the quote that it isn't what they agreed to, and a substitute, which is a change of identity. */
export type LineApproval = "NotRequired" | "Pending" | "Approved" | "Declined";

export interface ServiceTaskLineItem {
  id: string;
  productId: string;
  offeringId: string;
  providerId: string;
  itemFamily: string;
  displayName: string;
  brand: string | null;
  packSize: string | null;
  quantity: number;
  /** What the confirmed plan said. Never overwritten, so the number the customer agreed to stays visible. */
  quotedUnitPrice: number;
  /** What was actually paid. Null until the runner reports it. */
  actualUnitPrice: number | null;
  actualQuantity: number | null;
  outcome: LineOutcome;
  approval: LineApproval;
  proposedSubstituteProductId: string | null;
  proposedSubstituteDisplayName: string | null;
  proposedSubstituteUnitPrice: number | null;
}

export interface ServiceTask {
  id: string;
  taskCode: string;
  zoneId: string;
  zoneName: string;
  providerId: string;
  providerName: string;
  vendorSelection: "PlatformOptimized" | "CustomerPinned";
  fieldValues: Record<string, string>;
  lineItems: ServiceTaskLineItem[];
  estimatedPrice: number;
  /** Null while any line is still outstanding — a partial sum would read as a final bill. */
  actualTotal: number | null;
  estimatedEtaMinutes: number;
  status: TaskStatus;
  assignedVendorRef: string | null;
  assignedRunnerRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorTaskOffer {
  offerId: string;
  taskId: string;
  attemptNumber: number;
  offeredAt: string;
  expiresAt: string;
  task: ServiceTask;
}

/** ProviderRegistry's own Vendor/Runner split — a platform-dispatchable courier (Runner) versus a
 * business or individual that fulfills its own work (Vendor). Orthogonal to the "Shop or Vendor" /
 * "Independent Runner" choice shown at onboarding: that's a business-type label the person picks for
 * themselves (stored in Metadata.businessType, see BusinessType below), not this field. Most
 * providers this app will ever sign in are Kind=Vendor either way — a Mama Fua-style solo runner is
 * still a self-fulfilling Vendor in the backend's model. */
export type ProviderKind = "Vendor" | "Runner";

/** The onboarding label — "I stock goods and fulfill my own orders" vs "I take on jobs by
 * appointment". Free-form (Provider.Metadata has no fixed shape), so a provider from before this
 * existed has none; callers fall back to Kind (Runner-kind reads as "runner", Vendor-kind as "shop"). */
export type BusinessType = "shop" | "runner";

export interface ContactChannel {
  type: "InApp" | "WhatsApp" | "Phone";
  value: string;
  isPrimary: boolean;
}

export interface ProviderCoverage {
  id: string;
  zoneId: string;
  zoneName: string;
  categoryCode: string;
  isActive: boolean;
}

export interface Provider {
  id: string;
  name: string;
  userId: string | null;
  kind: ProviderKind;
  fulfillmentType: "VendorFulfilled" | "RunnerFulfilled";
  isActive: boolean;
  verificationStatus: "Pending" | "Verified" | "Rejected";
  verifiedAt: string | null;
  contactChannels: ContactChannel[];
  latitude: number | null;
  longitude: number | null;
  deliveryFee: number;
  serviceFee: number;
  minimumBasket: number;
  metadata: { businessType?: BusinessType; [key: string]: unknown };
  coverage: ProviderCoverage[];
}

export interface CatalogCategory {
  code: string;
  name: string;
}
