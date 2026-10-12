import { create } from "zustand";
import { FilterState, TaskItem, TaskPriority, TaskStatus } from "@/types";

interface UIState {
  // Global Reactive Tasks Store (for instant optimistic synchronization)
  tasks: TaskItem[];
  setTasks: (tasks: TaskItem[]) => void;
  addTask: (task: TaskItem) => void;
  updateTaskInStore: (taskId: string, updates: Partial<TaskItem>) => void;
  removeTaskFromStore: (taskId: string) => void;

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

  // Team Members & Role Isolation (RBAC) Modal
  isMembersModalOpen: boolean;
  setMembersModalOpen: (open: boolean) => void;

  // Create Project Modal
  isCreateProjectOpen: boolean;
  setCreateProjectOpen: (open: boolean) => void;

  // Activity Audit Log Panel
  isActivityLogsOpen: boolean;
  setActivityLogsOpen: (open: boolean) => void;

  // View Mode
  viewMode: "kanban" | "list" | "activity";
  setViewMode: (mode: "kanban" | "list" | "activity") => void;

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
  // Tasks State
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks.filter((t) => t.id !== task.id)],
    })),
  updateTaskInStore: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    })),
  removeTaskFromStore: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    })),

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

  // Members Modal
  isMembersModalOpen: false,
  setMembersModalOpen: (open) => set({ isMembersModalOpen: open }),

  // Create Project Modal
  isCreateProjectOpen: false,
  setCreateProjectOpen: (open) => set({ isCreateProjectOpen: open }),

  // Activity Logs Panel
  isActivityLogsOpen: false,
  setActivityLogsOpen: (open) => set({ isActivityLogsOpen: open }),

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
