import { ReservationRow } from './reservations.repository';
import { formatBrDate } from '../../utils/dateUtils';
import { formatCurrencyBr } from '../../utils/formatCurrency';

export interface ReservationResponse {
  id_reserve: string;
  id_user: string;
  start_date: string;
  end_date: string;
  id_car: string;
  final_value: string;
}

export function toReservationResponse(reservation: ReservationRow): ReservationResponse {
  return {
    id_reserve: reservation.id,
    id_user: reservation.user_id,
    start_date: formatBrDate(new Date(reservation.start_date)),
    end_date: formatBrDate(new Date(reservation.end_date)),
    id_car: reservation.car_id,
    final_value: formatCurrencyBr(Number(reservation.final_value)),
  };
}
