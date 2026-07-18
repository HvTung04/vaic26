import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useClasses } from './hooks/useClasses';
import type { ClassSummary } from './types';

const STORAGE_KEY = 'gaplens.selectedClassId';

interface SelectedClassContextValue {
  classId: string;
  setClassId: (id: string) => void;
  classes: ClassSummary[];
  selectedClass: ClassSummary | null;
  isLoading: boolean;
}

const SelectedClassContext = createContext<SelectedClassContextValue | null>(null);

/**
 * Every teacher-side feature (tests, roster, results…) is scoped to one class
 * at a time. This provider owns that selection so the sidebar's class picker
 * and every page under /dashboard stay in sync without prop drilling.
 */
export function SelectedClassProvider({ children }: { children: ReactNode }) {
  const { data: classes, isLoading } = useClasses();
  const [classId, setClassIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });

  // Once classes load, fall back to the first one if nothing (valid) is selected yet.
  useEffect(() => {
    if (!classes || classes.length === 0) return;
    const stillValid = classes.some((c) => c.id === classId);
    if (!stillValid) setClassIdState(classes[0].id);
  }, [classes, classId]);

  function setClassId(id: string) {
    setClassIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  const selectedClass = useMemo(
    () => classes?.find((c) => c.id === classId) ?? null,
    [classes, classId],
  );

  const value: SelectedClassContextValue = {
    classId,
    setClassId,
    classes: classes ?? [],
    selectedClass,
    isLoading,
  };

  return <SelectedClassContext.Provider value={value}>{children}</SelectedClassContext.Provider>;
}

export function useSelectedClass(): SelectedClassContextValue {
  const ctx = useContext(SelectedClassContext);
  if (!ctx) throw new Error('useSelectedClass must be used within <SelectedClassProvider>');
  return ctx;
}
