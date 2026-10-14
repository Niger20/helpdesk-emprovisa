import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { assetCreateSchema } from '@helpdesk/contracts';
import type { AssetCreate } from '@helpdesk/contracts';
import { useAuth } from '../../../hooks/useAuth';
import { createAsset } from '../api/assets.api';
import { assetKeys } from '../api/assets.keys';

export function useAssetForm() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const session = useAuth();
  const form = useForm<AssetCreate>({ resolver: zodResolver(assetCreateSchema), mode: 'onBlur', defaultValues: {
    codigoPatrimonial: '', descripcion: '', idSede: session.data?.usuario.sede.idSede ?? 0, idTipoActivo: 0,
    marca: null, modelo: null, numeroSerie: null, idCustodio: null, actaNumero: '', estado: 'ACTIVO', fechaAdquisicion: null, garantiaHasta: null,
  } });
  const mutation = useMutation({ mutationFn: (data: AssetCreate) => {
    if (!session.data) throw new Error('Iniciá sesión para registrar el activo.');
    return createAsset(data, session.data.csrfToken);
  }, onSuccess: async (asset) => {
    await client.invalidateQueries({ queryKey: assetKeys.all });
    void navigate(`/activos/${encodeURIComponent(asset.codigoPatrimonial)}`);
  } });
  return { form, submit: form.handleSubmit((data) => mutation.mutate(data)), pending: mutation.isPending, error: mutation.error?.message };
}
