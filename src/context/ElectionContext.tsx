import React, { createContext, useContext, useState, useEffect } from 'react';
import { Election, State, LGA, Ward } from '../types';
import { fetchElections, fetchStates, fetchLgas, fetchWards } from '../services/api';

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
  wards: Ward[];
  selectedWardCode: string;
  setSelectedWardCode: (code: string) => void;
  uploadStatusFilter: string;
  setUploadStatusFilter: (status: string) => void;
  verificationStatusFilter: string;
  setVerificationStatusFilter: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  refreshGeography: () => Promise<void>;
  refreshElections: () => Promise<void>;
  isLoading: boolean;
}

const ElectionContext = createContext<ElectionContextType | undefined>(undefined);

export function getContestDefaultStateCode(
  electionId: string,
  electionsList: Election[],
  statesList: State[]
): string {
  if (electionId === 'elec-2026-gov-osun') return 'OSUN';
  if (electionId === 'elec-2026-gov-ekiti') return 'EKITI';
  const elec = electionsList.find((e) => e.id === electionId) as any;
  if (!elec) return '';
  if (elec.stateCode) return String(elec.stateCode);
  if (elec.electionType === 'PRESIDENTIAL') return '';
  const titleUpper = (elec.title || '').toUpperCase();
  for (const st of statesList) {
    if (titleUpper.includes(st.name.toUpperCase()) || titleUpper.includes(st.code.toUpperCase())) {
      return st.code;
    }
  }
  return '';
}

export const ElectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('elec-2026-gov-osun');
  const [states, setStates] = useState<State[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState<string>('OSUN');
  const [lgas, setLgas] = useState<LGA[]>([]);
  const [selectedLgaCode, setSelectedLgaCode] = useState<string>('');
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWardCode, setSelectedWardCode] = useState<string>('');
  const [uploadStatusFilter, setUploadStatusFilter] = useState<string>('');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshElections = async () => {
    try {
      const elecRes = await fetchElections();
      setElections(elecRes.data);
    } catch (err) {
      console.error('Failed to refresh elections:', err);
    }
  };

  const refreshGeography = async () => {
    try {
      const statesRes = await fetchStates();
      setStates(statesRes.data);
      if (selectedStateCode) {
        const lgaRes = await fetchLgas(selectedStateCode);
        setLgas(lgaRes.data);
      }
      if (selectedLgaCode) {
        const wardRes = await fetchWards(selectedLgaCode, selectedStateCode || undefined);
        setWards(wardRes.data);
      }
    } catch (err) {
      console.error('Failed to refresh geography:', err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const [elecRes, statesRes] = await Promise.all([fetchElections(), fetchStates()]);
        setElections(elecRes.data);
        setStates(statesRes.data);
        const defaultElecId = elecRes.data.length > 0 ? elecRes.data[0].id : 'elec-2026-gov-osun';
        setSelectedElectionId(defaultElecId);
        const defaultState = getContestDefaultStateCode(defaultElecId, elecRes.data, statesRes.data);
        setSelectedStateCode(defaultState);
      } catch (err) {
        console.error('Failed to initialize election context:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Whenever the selected contest election changes, automatically scope to its default state (e.g. OSUN for Osun Governorship, EKITI for Ekiti Governorship, '' for Presidential)
  useEffect(() => {
    if (elections.length === 0 && states.length === 0) return;
    const defaultState = getContestDefaultStateCode(selectedElectionId, elections, states);
    setSelectedStateCode(defaultState);
    setSelectedLgaCode('');
    setSelectedWardCode('');
  }, [selectedElectionId]);

  useEffect(() => {
    async function loadLgas() {
      setSelectedLgaCode('');
      setSelectedWardCode('');
      setWards([]);
      if (selectedStateCode) {
        try {
          const res = await fetchLgas(selectedStateCode);
          setLgas(res.data);
        } catch (err) {
          console.error('Failed to load LGAs:', err);
        }
      } else {
        setLgas([]);
      }
    }
    loadLgas();
  }, [selectedStateCode]);

  useEffect(() => {
    async function loadWards() {
      setSelectedWardCode('');
      if (selectedLgaCode) {
        try {
          const res = await fetchWards(selectedLgaCode, selectedStateCode || undefined);
          setWards(res.data);
        } catch (err) {
          console.error('Failed to load Wards:', err);
        }
      } else {
        setWards([]);
      }
    }
    loadWards();
  }, [selectedLgaCode]);

  const resetFilters = () => {
    const defaultState = getContestDefaultStateCode(selectedElectionId, elections, states);
    setSelectedStateCode(defaultState);
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
        wards,
        selectedWardCode,
        setSelectedWardCode,
        uploadStatusFilter,
        setUploadStatusFilter,
        verificationStatusFilter,
        setVerificationStatusFilter,
        searchQuery,
        setSearchQuery,
        resetFilters,
        refreshGeography,
        refreshElections,
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

