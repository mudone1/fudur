export type AccountType = "rider" | "driver";

export interface UserProfile {
  uid: string;
  phone: string | null;
  name: string;
  area: string;
  type: AccountType;
  rating: number;
  trips: number;
  createdAt?: unknown; // Firestore server timestamp on write, Timestamp on read
}

export interface DriverRoute {
  id?: string;
  driverUid: string;
  from: string;
  to: string;
  departureTime: string; // "07:15"
  meetingPoint: string;
  days: string[]; // ["Mon","Tue",...]
  pricePerSeat: number;
  seats: number;
  seatsBooked?: number;
  active: boolean;
  car?: {
    make: string;
    model: string;
    plate: string;
    colour: string;
    year: number;
  };
  createdAt?: unknown;
}

export interface Booking {
  id?: string;
  routeId: string;
  riderUid: string;
  driverUid: string;
  status: "active" | "completed" | "cancelled";
  tripDate: string; // "2026-07-05"
  fare: number;
  createdAt?: unknown;
}

export interface ChatMessage {
  id?: string;
  senderUid: string;
  senderName: string;
  text: string;
  createdAt?: unknown;
}

export interface DriverApplication {
  uid: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  route: {
    from: string;
    to: string;
    departureTime: string;
    meetingPoint: string;
    days: string[];
    pricePerSeat: number;
  };
  car: {
    make: string;
    model: string;
    plate: string;
    year: number;
    colour: string;
    seats: number;
  };
  status: "pending" | "approved" | "rejected";
  createdAt?: unknown;
}

export interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalTrips: number;
  totalPassengers: number;
  avgRating: number;
}

export interface TripLogEntry {
  id: string;
  route: string;
  dateLabel: string;
  timeLabel: string;
  passengers: number;
  fare: number;
}
