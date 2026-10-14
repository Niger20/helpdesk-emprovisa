export const loadAuditPage = () => import('./pages/AuditPage').then((page) => ({ default: page.AuditPage }));
