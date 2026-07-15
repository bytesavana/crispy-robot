export type CartTaskStatus =
  | "Draft"
  | "Confirmed"
  | "Assigned"
  | "InProgress"
  | "Completed"
  | "Cancelled"
  | "Failed";

export type CartTask = {
  task_id: string;
  task_code: string;
  status: CartTaskStatus;
  field_values: Record<string, string>;
  estimated_price: number | null;
  estimated_eta_minutes: number | null;
};

export type Cart = {
  service_request_id: string | null;
  tasks: CartTask[];
  total_estimated_price: number | null;
};
