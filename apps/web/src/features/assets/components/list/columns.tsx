import { Link } from 'react-router';
import { tableFeatures } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { Asset } from '@helpdesk/contracts';
import { assetStateLabels } from '../../lib/format';

export const assetTableFeatures = tableFeatures({});
export const assetColumns: ColumnDef<typeof assetTableFeatures, Asset, unknown>[] = [
  { accessorKey: 'codigoPatrimonial', header: 'Código patrimonial', cell: ({ row }) => <Link className="inline-flex min-h-10 items-center font-semibold text-primary underline" to={`/activos/${encodeURIComponent(row.original.codigoPatrimonial)}`}>{row.original.codigoPatrimonial}</Link> },
  { id: 'tipo', header: 'Tipo', cell: ({ row }) => row.original.tipoActivo.nombre },
  { id: 'equipo', header: 'Marca y modelo', cell: ({ row }) => [row.original.marca, row.original.modelo].filter(Boolean).join(' ') || 'No registrado' },
  { accessorKey: 'numeroSerie', header: 'Serie', cell: ({ row }) => row.original.numeroSerie ?? 'No registrada' },
  { id: 'sede', header: 'Sede', cell: ({ row }) => row.original.sede.nombre },
  { id: 'custodio', header: 'Custodio', cell: ({ row }) => row.original.custodio?.nombreCompleto ?? 'Sin custodio' },
  { accessorKey: 'estado', header: 'Estado', cell: ({ row }) => assetStateLabels[row.original.estado] },
];
