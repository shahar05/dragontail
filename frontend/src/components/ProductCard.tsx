import { ProductForecast } from '../types';
import { formatHour } from '../utils/format';

interface ProductCardProps {
  product: ProductForecast;
}

function ProductCard({ product }: ProductCardProps) {
  const totalPredicted = product.hourly_data.reduce((sum, point) => sum + point.predicted_quantity, 0);
  const peakHour = product.hourly_data.reduce(
    (max, point) => (point.predicted_quantity > max.predicted_quantity ? point : max),
    product.hourly_data[0] || { hour: 0, predicted_quantity: 0 },
  );
  const maxQuantity = Math.max(...product.hourly_data.map((point) => point.predicted_quantity), 1);

  return (
    <div key={product.product_id} className="product-card">
      <div className="product-header">
        <div>
          <h3>{product.product_name}</h3>
          <span className="category-badge">{product.category}</span>
        </div>
        <div className="product-stats">
          <div className="stat-small">
            <span className="stat-small-value">{Math.round(totalPredicted)}</span>
            <span className="stat-small-label">Total</span>
          </div>
          <div className="stat-small">
            <span className="stat-small-value">{formatHour(peakHour.hour)}</span>
            <span className="stat-small-label">Peak</span>
          </div>
        </div>
      </div>

      <div className="hourly-chart">
        {product.hourly_data.map((point) => {
          const height = Math.round((point.predicted_quantity / maxQuantity) * 100);
          return (
            <div
              key={point.hour}
              className="bar-wrapper"
              title={`${formatHour(point.hour)}: ${Math.round(point.predicted_quantity)} units`}
            >
              <div className="bar" style={{ height: `${height}%` }}></div>
              <span className="bar-label">{point.hour}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProductCard;
