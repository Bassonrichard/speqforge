import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * UI modal IDs for centralized modal management
 */
export type ModalId =
  | 'create-project'
  | 'attach-repository'
  | 'create-feature'
  | 'generate-spec'
  | 'request-review'
  | 'approve-spec'
  | 'reject-spec'
  | 'handoff-spec'
  | 'template-upload'
  | 'settings-llm'
  | 'settings-approval'
  | 'confirm-delete';

/**
 * Sidebar navigation states
 */
export type SidebarView = 'dashboard' | 'projects' | 'specs' | 'settings' | 'docs';

/**
 * UI store state and actions
 */
interface UIStoreState {
  // Modals
  openModals: Set<ModalId>;
  modalData: Record<string, unknown>;

  // Sidebar
  sidebarOpen: boolean;
  sidebarView: SidebarView;

  // Session
  sessionExpiringWarning: boolean;
  sessionExpiringIn: number | null;

  // Notifications (simple toast management)
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
  }>;

  // Loading states
  globalLoadingState: Record<string, boolean>;

  // Actions: Modals
  openModal: (id: ModalId, data?: unknown) => void;
  closeModal: (id: ModalId) => void;
  closeAllModals: () => void;
  isModalOpen: (id: ModalId) => boolean;
  getModalData: (id: ModalId) => unknown;

  // Actions: Sidebar
  toggleSidebar: () => void;
  setSidebarView: (view: SidebarView) => void;

  // Actions: Session
  setSessionExpiringWarning: (expiringIn: number | null) => void;

  // Actions: Notifications
  addNotification: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
    duration?: number
  ) => string; // returns notification ID
  removeNotification: (id: string) => void;

  // Actions: Loading
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;
}

/**
 * UI store - manages global UI state (modals, sidebar, notifications, etc.)
 * Not persisted - resets on page refresh
 */
export const useUIStore = create<UIStoreState>()(
  immer((set, get) => ({
    openModals: new Set<ModalId>(),
    modalData: {},
    sidebarOpen: true,
    sidebarView: 'dashboard',
    sessionExpiringWarning: false,
    sessionExpiringIn: null,
    notifications: [],
    globalLoadingState: {},

    openModal: (id, data) => {
      set((state) => {
        state.openModals.add(id);
        if (data !== undefined) {
          state.modalData[id] = data;
        }
      });
    },

    closeModal: (id) => {
      set((state) => {
        state.openModals.delete(id);
        delete state.modalData[id];
      });
    },

    closeAllModals: () => {
      set((state) => {
        state.openModals.clear();
        state.modalData = {};
      });
    },

    isModalOpen: (id) => {
      return get().openModals.has(id);
    },

    getModalData: (id) => {
      return get().modalData[id];
    },

    toggleSidebar: () => {
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      });
    },

    setSidebarView: (view) => {
      set((state) => {
        state.sidebarView = view;
        state.sidebarOpen = true; // auto-open sidebar on view change
      });
    },

    setSessionExpiringWarning: (expiringIn) => {
      set((state) => {
        state.sessionExpiringWarning = expiringIn !== null;
        state.sessionExpiringIn = expiringIn;
      });
    },

    addNotification: (message, type, duration = 4000) => {
      const id = `notification-${Date.now()}-${Math.random()}`;

      set((state) => {
        state.notifications.push({ id, message, type, duration });
      });

      // Auto-remove notification after duration
      if (duration > 0) {
        setTimeout(() => {
          get().removeNotification(id);
        }, duration);
      }

      return id;
    },

    removeNotification: (id) => {
      set((state) => {
        state.notifications = state.notifications.filter((n) => n.id !== id);
      });
    },

    setLoading: (key, isLoading) => {
      set((state) => {
        state.globalLoadingState[key] = isLoading;
      });
    },

    isLoading: (key) => {
      return get().globalLoadingState[key] ?? false;
    },
  }))
);

/**
 * Hook to check if any modals are open
 */
export function useHasOpenModals(): boolean {
  const openModals = useUIStore((state) => state.openModals);
  return openModals.size > 0;
}

/**
 * Hook to show a notification
 */
export function useNotification() {
  const addNotification = useUIStore((state) => state.addNotification);

  return {
    success: (message: string, duration?: number) =>
      addNotification(message, 'success', duration),
    error: (message: string, duration?: number) => addNotification(message, 'error', duration),
    info: (message: string, duration?: number) => addNotification(message, 'info', duration),
    warning: (message: string, duration?: number) =>
      addNotification(message, 'warning', duration),
  };
}

/**
 * Hook to manage a specific modal
 */
export function useModal(modalId: ModalId) {
  const isOpen = useUIStore((state) => state.openModals.has(modalId));
  const open = useUIStore((state) => state.openModal);
  const close = useUIStore((state) => state.closeModal);
  const data = useUIStore((state) => state.modalData[modalId]);

  return {
    isOpen,
    open: (modalData?: unknown) => open(modalId, modalData),
    close: () => close(modalId),
    data,
  };
}
