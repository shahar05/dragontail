import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

const STORAGE_KEY = 'kfc_forecast_preferences';

interface PreferencesState {
  selectedStoreId: number | null;
  selectedDate: string;
}

type PreferencesAction =
  | { type: 'hydrate'; payload: PreferencesState }
  | { type: 'setStore'; payload: number | null }
  | { type: 'setDate'; payload: string };

interface PreferencesContextValue {
  state: PreferencesState;
  setSelectedStore: (storeId: number | null) => void;
  setSelectedDate: (date: string) => void;
}

const initialState: PreferencesState = {
  selectedStoreId: null,
  selectedDate: '',
};

function preferencesReducer(state: PreferencesState, action: PreferencesAction): PreferencesState {
  switch (action.type) {
    case 'hydrate':
      return action.payload;
    case 'setStore':
      return { ...state, selectedStoreId: action.payload };
    case 'setDate':
      return { ...state, selectedDate: action.payload };
    default:
      return state;
  }
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

function loadPreferences(): PreferencesState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return initialState;
  }

  try {
    const parsed = JSON.parse(saved) as PreferencesState;
    return {
      selectedStoreId: parsed.selectedStoreId ?? null,
      selectedDate: parsed.selectedDate ?? '',
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return initialState;
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(preferencesReducer, initialState, loadPreferences);

  const setSelectedStore = useCallback(
    (storeId: number | null) => dispatch({ type: 'setStore', payload: storeId }),
    [],
  );

  const setSelectedDate = useCallback(
    (date: string) => dispatch({ type: 'setDate', payload: date }),
    [],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      state,
      setSelectedStore,
      setSelectedDate,
    }),
    [setSelectedDate, setSelectedStore, state],
  );

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
