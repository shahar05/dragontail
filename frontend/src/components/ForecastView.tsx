import { ForecastResponse } from '../types';
import { formatDateLong } from '../utils/format';
import EmptyState from './EmptyState';
import ProductCard from './ProductCard';

interface ForecastViewProps {
  forecast: ForecastResponse;
  selectedDate: string;
}

function ForecastView({ forecast, selectedDate }: ForecastViewProps) {
  return (
    <div className="forecast-view">
      <div className="forecast-header">
        <div>
          <h2>{forecast.store_name}</h2>
          <p className="forecast-date">📅 {formatDateLong(selectedDate)}</p>
        </div>
        <div className="forecast-stats">
          <div className="stat">
            <span className="stat-value">{forecast.products?.length || 0}</span>
            <span className="stat-label">Products</span>
          </div>
        </div>
      </div>

      {forecast.products.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No Forecast Data"
          description="No product forecasts are available for this date yet."
        />
      ) : (
        <div className="products-grid">
          {forecast.products.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ForecastView;
