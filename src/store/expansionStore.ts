/**
 * @file expansionStore.ts
 * @description A Zustand store for managing the expansion state of programs and projects in the PPMP interface.
 * This store persists the expansion state in localStorage to maintain UI state across page refreshes.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * @interface ExpansionState
 * @description Defines the shape of the expansion store state and its methods
 * @property {Set<string>} expandedPrograms - Set of program IDs that are currently expanded
 * @property {Set<string>} expandedProjects - Set of project IDs that are currently expanded
 * @property {function} toggleProgramExpansion - Toggles the expansion state of a program
 * @property {function} toggleProjectExpansion - Toggles the expansion state of a project
 * @property {function} clearExpansionState - Resets all expansion states to their initial values
 */
interface ExpansionState {
    expandedPrograms: Set<string>;
    expandedProjects: Set<string>;
    toggleProgramExpansion: (programId: string) => void;
    toggleProjectExpansion: (projectId: string) => void;
    clearExpansionState: () => void;
}

/**
 * @interface PersistedState
 * @description Defines the shape of the state that will be persisted in localStorage
 * Arrays are used instead of Sets because Sets cannot be directly serialized to JSON
 */
type PersistedState = {
    expandedPrograms: string[];
    expandedProjects: string[];
};

/**
 * @constant useExpansionStore
 * @description A Zustand store that manages the expansion state of programs and projects
 * The store is persisted in localStorage using Zustand's persist middleware
 * 
 * @example
 * // Toggle program expansion
 * const { toggleProgramExpansion } = useExpansionStore();
 * toggleProgramExpansion('program-123');
 * 
 * // Check if a program is expanded
 * const { expandedPrograms } = useExpansionStore();
 * const isExpanded = expandedPrograms.has('program-123');
 */
export const useExpansionStore = create<ExpansionState>()(
    persist(
        (set) => ({
            expandedPrograms: new Set<string>(),
            expandedProjects: new Set<string>(),
            toggleProgramExpansion: (programId: string) =>
                set((state) => {
                    const newSet = new Set(state.expandedPrograms);
                    if (newSet.has(programId)) {
                        newSet.delete(programId);
                    } else {
                        newSet.add(programId);
                    }
                    return { expandedPrograms: newSet };
                }),
            toggleProjectExpansion: (projectId: string) =>
                set((state) => {
                    const newSet = new Set(state.expandedProjects);
                    if (newSet.has(projectId)) {
                        newSet.delete(projectId);
                    } else {
                        newSet.add(projectId);
                    }
                    return { expandedProjects: newSet };
                }),
            clearExpansionState: () =>
                set({
                    expandedPrograms: new Set<string>(),
                    expandedProjects: new Set<string>(),
                }),
        }),
        {
            name: 'expansion-storage',
            storage: createJSONStorage<PersistedState>(() => localStorage),
            partialize: (state): PersistedState => ({
                expandedPrograms: Array.from(state.expandedPrograms),
                expandedProjects: Array.from(state.expandedProjects),
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Convert arrays back to Sets
                    state.expandedPrograms = new Set(state.expandedPrograms);
                    state.expandedProjects = new Set(state.expandedProjects);
                }
            },
        }
    )
); 