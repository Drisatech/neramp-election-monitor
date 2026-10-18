import React, { createContext, useContext, useState, useEffect } from 'react';
import { Election, State, LGA } from '../types';
import { fetchElections, fetchStates, fetchLgas } from '../services/api';

interface ElectionContextType {
  elections: Election[];
  selectedElectionId: string;
  setSelectedElectionId: (id: string) => void;
  states: State[];
  selectedStateCode: string;
  setSelectedStateCode: (code: string) => void;
  lgas: LGA[];
  selectedLgaCode: string;
  setSelectedLgaCode: (code: string) => void;
  selectedWardCode: string;
  setSelectedWardCode: (code: string) => void;
  uploadStatusFilter: string;
  setUploadStatusFilter: (status: string) => void;
  verificationStatusFilter: string;
  setVerificationStatusFilter: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  isLoading: boolean;
}

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('elec-2026-gov-osun');
  const [states, setStates] = useState<State[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState<string>('');
  const [lgas, setLgas] = useState<LGA[]>([]);
  const [selectedLgaCode, setSelectedLgaCode] = useState<string>('');
  const [selectedWardCode, setSelectedWardCode] = useState<string>('');
  const [uploadStatusFilter, setUploadStatusFilter] = useState<string>('');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const [elecRes, statesRes] = await Promise.all([fetchElections(), fetchStates()]);
        setElections(elecRes.data);
        setStates(statesRes.data);
        if (elecRes.data.length > 0) {
          setSelectedElectionId(elecRes.data[0].id);
        }
      } catch (err) {
        console.error('Failed to initialize election context:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loadLgas() {
      if (selectedStateCode) {
        try {
          const res = await fetchLgas(selectedStateCode);
          setLgas(res.data);
        } catch (err) {
          console.error('Failed to load LGAs:', err);
        }
      } else {
        setLgas([]);
        setSelectedLgaCode('');
        setSelectedWardCode('');
      }
    }
    loadLgas();
  }, [selectedStateCode]);

  const resetFilters = () => {
    setSelectedStateCode('');
    setSelectedLgaCode('');
    setSelectedWardCode('');
    setUploadStatusFilter('');
    setVerificationStatusFilter('');
    setSearchQuery('');
  };

  return (
    <ElectionContext.Provider
      value={{
        elections,
        selectedElectionId,
        setSelectedElectionId,
        states,
        selectedStateCode,
        setSelectedStateCode,
        lgas,
        selectedLgaCode,
        setSelectedLgaCode,
        selectedWardCode,
        setSelectedWardCode,
        uploadStatusFilter,
        setUploadStatusFilter,
        verificationStatusFilter,
        setVerificationStatusFilter,
        searchQuery,
        setSearchQuery,
        resetFilters,
        isLoading,
      }}
    >
      {children}
    </ElectionContext.Provider>
  );
};

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (!context) throw new Error('useElection must be used within ElectionProvider');
  return context;
};
