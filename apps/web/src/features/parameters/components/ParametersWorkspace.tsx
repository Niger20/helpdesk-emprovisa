import type { useParameters } from '../hooks/useParameters';
import { QueryBoundary } from '../../../components/common/QueryBoundary';
import { ParameterForm } from './ParameterForm';

export function ParametersWorkspace({ query }: { query: ReturnType<typeof useParameters> }) {
  return <QueryBoundary query={query} isEmpty={(data) => data.data.length === 0}>{(data) =>
    <div className="grid gap-4 lg:grid-cols-2">{data.data.map((parameter) => <ParameterForm key={`${parameter.clave}:${parameter.valor}:${parameter.modificadoEn}`} parameter={parameter} />)}</div>
  }</QueryBoundary>;
}
