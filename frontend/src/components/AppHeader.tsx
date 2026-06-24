interface AppHeaderProps {
  generating: boolean;
  onGenerateForecast: () => void;
}

function AppHeader({ generating, onGenerateForecast }: AppHeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <span className="header-logo">🍗</span>
          <div>
            <h1>KFC Sales Forecast</h1>
            <p>Daily store and product sales predictions</p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onGenerateForecast} disabled={generating}>
          {generating ? '⏳ Generating...' : "🔄 Generate Tomorrow's Forecast"}
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
