import React, { createContext, useContext, useState, useEffect } from 'react';

const initialState = {
  income: 0,
  expenses: 0,
  emi: 0,
  assets: [], // {id, name, value, type}
  liabilities: [], // {id, name, value, interest, emi, type}
  goals: [], // {id, name, target, saved, contribution, roi, date}
  protection: {
    termInsurance: 0,
    healthInsurance: 0,
    emergencyTarget: 0,
    emergencyCurrent: 0
  },
  settings: {
    openaiApiKey: ''
  },
  lastUpdated: 0
};

const AppStateContext = createContext();

export const AppStateProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('fingoal_v2');
    return saved ? JSON.parse(saved) : initialState;
  });

  useEffect(() => {
    localStorage.setItem('fingoal_v2', JSON.stringify(state));
    // Trigger gdrive sync here via a global or imported util later
    if (window.syncToDrive) {
      window.syncToDrive(state);
    }
  }, [state]);

  const updateField = (field, value) => {
    setState(prev => ({ ...prev, [field]: value, lastUpdated: Date.now() }));
  };

  const updateProtection = (field, value) => {
    setState(prev => ({
      ...prev,
      protection: { ...prev.protection, [field]: value },
      lastUpdated: Date.now()
    }));
  };

  const addItem = (listName, item) => {
    setState(prev => ({
      ...prev,
      [listName]: [...prev[listName], { ...item, id: crypto.randomUUID() }],
      lastUpdated: Date.now()
    }));
  };

  const removeItem = (listName, id) => {
    setState(prev => ({
      ...prev,
      [listName]: prev[listName].filter(item => item.id !== id),
      lastUpdated: Date.now()
    }));
  };

  const updateItem = (listName, id, updatedItem) => {
    setState(prev => ({
      ...prev,
      [listName]: prev[listName].map(item => item.id === id ? { ...item, ...updatedItem } : item),
      lastUpdated: Date.now()
    }));
  };

  // Expose global state setter for GDrive sync
  useEffect(() => {
    window.updateAppStateFromDrive = (data) => {
      // Merge setting so we don't accidentally wipe out lastUpdated if drive is older, 
      // but the gdrive.js logic will only call this if drive is newer.
      setState(data);
    };
  }, []);

  return (
    <AppStateContext.Provider value={{
      state,
      setState,
      updateField,
      updateProtection,
      addItem,
      removeItem,
      updateItem
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => useContext(AppStateContext);
