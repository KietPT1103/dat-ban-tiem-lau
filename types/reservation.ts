export interface Table {
  id: string;
  name: string;
  capacity: number;
}

export interface ReservationForm {
  customerName: string;
  phone: string;
  guestCount: number;
  reservationTime: string;
}

export interface Reservation extends ReservationForm {
  tableId: string;
}

export interface ReservationItem {
  id: string;  
  customerName: string;
  phone: string;
  guestCount: number;
  reservationTime: string;
  tableId: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  reservationCount?: number;
  reservations?: ReservationItem[];
}
