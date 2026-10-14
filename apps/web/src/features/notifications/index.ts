export const loadNotificationsPage = () => import('./pages/NotificationsPage').then((page) => ({ default: page.NotificationsPage }));
