import { reportsSchema } from '@helpdesk/contracts';
import type { ReportsQuery } from '@helpdesk/contracts';
import type { ReportRow } from './reports.repository.js';
import { calculateReport } from './domain/metrics.js';

export const mapReport = (rows: ReportRow[], query: ReportsQuery) => reportsSchema.parse(calculateReport(rows, query, new Date()));
