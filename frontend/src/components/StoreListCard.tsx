import { Store } from '../types';

interface StoreListCardProps {
  stores: Store[];
  selectedStore: number | null;
  onSelectStore: (storeId: number) => void;
}

function StoreListCard({ stores, selectedStore, onSelectStore }: StoreListCardProps) {
  return (
    <div className="card">
      <h2>📍 Stores</h2>
      <div className="store-list">
        {stores.map((store) => (
          <button
            key={store.id}
            className={`store-item ${selectedStore === store.id ? 'active' : ''}`}
            onClick={() => onSelectStore(store.id)}
          >
            <span className="store-name">{store.name}</span>
            <span className="store-location">{store.location}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default StoreListCard;
