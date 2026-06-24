import { formatDateShort } from '../utils/format';

interface ForecastDatesCardProps {
  availableDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function ForecastDatesCard({ availableDates, selectedDate, onSelectDate }: ForecastDatesCardProps) {
  if (availableDates.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h2>📅 Forecast Dates</h2>
      <div className="date-list">
        {availableDates.map((date) => (
          <button
            key={date}
            className={`date-item ${selectedDate === date ? 'active' : ''}`}
            onClick={() => onSelectDate(date)}
          >
            {formatDateShort(date)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ForecastDatesCard;
