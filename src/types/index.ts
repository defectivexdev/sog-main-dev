export interface Member {
  id: string;
  discordId?: string | null;
  name: string;
  icName?: string | null;
  nickname?: string | null;
  role: string;
  avatar?: string | null;
  phone?: string | null;
  lineId?: string | null;
  joinDate: string | Date;
  status: "active" | "inactive" | "left" | string;
  houseId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface House {
  id: string;
  name: string;
  headId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Settings {
  id: string;
  weeklyTaxAmount: number;
  bankAccountNo?: string | null;
  bankAccountName?: string | null;
  webhookPayment?: string | null;
  webhookLeave?: string | null;
  webhookAirdrop?: string | null;
  updatedAt?: string | Date;
}

export interface Activity {
  id: string;
  name: string;
  description?: string | null;
  date: string | Date;
  location?: string | null;
  participants: string[];
  maxParticipants?: number | null;
  status: string;
  createdBy?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AirdropItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface AirdropSession {
  id: string;
  sessionName: string;
  date: string | Date;
  items: AirdropItem[];
  checkedMembers: string[];
  status: string;
  createdBy?: string | null;
  discordMessageId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Attendance {
  id: string;
  memberId: string;
  memberName: string;
  date: string | Date;
  status: string;
  note?: string | null;
  recordedBy?: string | null;
  discordMessageId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface LeaveRecord {
  id: string;
  memberName: string;
  startDate: string | Date;
  endDate: string | Date;
  reason: string;
  imageUrl?: string | null;
  status: "pending" | "approved" | "rejected" | string;
  rejectReason?: string | null;
  requestDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Payment {
  id: string;
  memberName: string;
  amount: number;
  type: "income" | "expense" | string;
  description?: string | null;
  image?: string | null;
  date: string | Date;
  status: "pending" | "confirmed" | "rejected" | string;
  confirmedBy?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ReqRecord {
  id: string;
  memberName: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: string;
  imageUrl?: string | null;
  status: "pending" | "approved" | "rejected" | "delivered" | string;
  rejectReason?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface StoreItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  category: string;
  status: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface WelfareItem {
  id: string;
  name: string;
  description?: string | null;
  amount: number;
  unit: string;
  cooldownDays: number;
  imageUrl?: string | null;
  status: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface GangVehicle {
  id: string;
  model: string;
  plate: string;
  amount: number;
  status: string;
  holderName?: string | null;
  holderId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt?: string | Date;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  actorName: string;
  details?: string | null;
  createdAt?: string | Date;
}

export interface GangEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  location?: string | null;
  createdBy: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// API Responses
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  pagination?: PaginationMeta;
  error?: string;
  details?: any;
  totals?: any;
}
