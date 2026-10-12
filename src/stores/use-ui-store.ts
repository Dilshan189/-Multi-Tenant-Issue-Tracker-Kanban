import { create } from "zustand";
import { FilterState, TaskPriority, TaskStatus } from "@/types";

interface UIState {
  // Create Task Modal
  isCreateTaskOpen: boolean;
  createTaskDefaultStatus: TaskStatus;
  createTaskDefaultProjectId: string | null;
  openCreateTask: (defaultStatus?: TaskStatus, defaultProjectId?: string | null) => void;
  closeCreateTask: () => void;

  // Task Details Drawer / Modal
  selectedTaskId: string | null;
  openTaskDetails: (taskId: string) => void;
  closeTaskDetails: () => void;

  // AI Assistant Drawer
  isAIAssistantOpen: boolean;
  toggleAIAssistant: () => void;
  setAIAssistantOpen: (open: boolean) => void;

  // View Mode
  viewMode: "kanban" | "list";
  setViewMode: (mode: "kanban" | "list") => void;

  // Filters
  filters: FilterState;
  setSearchQuery: (query: string) => void;
  setProjectFilter: (projectId: string | null) => void;
  setPriorityFilter: (priority: TaskPriority | null) => void;
  setAssigneeFilter: (assigneeId: string | null) => void;
  resetFilters: () => void;
}

const initialFilters: FilterState = {
  searchQuery: "",
  projectId: null,
  priority: null,
  assigneeId: null,
};

export const useUIStore = create<UIState>((set) => ({
  // Create Task
  isCreateTaskOpen: false,
  createTaskDefaultStatus: "TODO",
  createTaskDefaultProjectId: null,
  openCreateTask: (defaultStatus = "TODO", defaultProjectId = null) =>
    set({
      isCreateTaskOpen: true,
      createTaskDefaultStatus: defaultStatus,
      createTaskDefaultProjectId: defaultProjectId,
    }),
  closeCreateTask: () => set({ isCreateTaskOpen: false }),

  // Task Details
  selectedTaskId: null,
  openTaskDetails: (taskId) => set({ selectedTaskId: taskId }),
  closeTaskDetails: () => set({ selectedTaskId: null }),

  // AI Assistant Drawer
  isAIAssistantOpen: false,
  toggleAIAssistant: () => set((state) => ({ isAIAssistantOpen: !state.isAIAssistantOpen })),
  setAIAssistantOpen: (open) => set({ isAIAssistantOpen: open }),

  // View Mode
  viewMode: "kanban",
  setViewMode: (mode) => set({ viewMode: mode }),

  // Filters
  filters: initialFilters,
  setSearchQuery: (query) =>
    set((state) => ({ filters: { ...state.filters, searchQuery: query } })),
  setProjectFilter: (projectId) =>
    set((state) => ({ filters: { ...state.filters, projectId } })),
  setPriorityFilter: (priority) =>
    set((state) => ({ filters: { ...state.filters, priority } })),
  setAssigneeFilter: (assigneeId) =>
    set((state) => ({ filters: { ...state.filters, assigneeId } })),
  resetFilters: () => set({ filters: initialFilters }),
}));
