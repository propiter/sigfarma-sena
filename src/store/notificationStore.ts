import { create } from 'zustand';

interface Notification {
  notificacionId: number;
  tipoNotificacion: string;
  mensaje: string;
  fechaCreacion: string;
  fechaVisto: string | null;
  prioridad: string;
  producto: {
    productoId: number;
    nombre: string;
    presentacion: string;
    stockTotal: number;
    stockMinimo: number;
  };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/notifications?limit=50', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        set({ 
          notifications: data.notifications || [],
          unreadCount: (data.notifications || []).filter((n: Notification) => !n.fechaVisto).length
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.notificacionId === id 
              ? { ...n, fechaVisto: new Date().toISOString() }
              : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, fechaVisto: new Date().toISOString() })),
          unreadCount: 0
        }));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  dismissNotification: async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        set(state => {
          const notification = state.notifications.find(n => n.notificacionId === id);
          const unreadDelta = notification && !notification.fechaVisto ? 1 : 0;
          
          return {
            notifications: state.notifications.filter(n => n.notificacionId !== id),
            unreadCount: Math.max(0, state.unreadCount - unreadDelta)
          };
        });
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }
}));