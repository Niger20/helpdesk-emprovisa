import type { SurveyReceipt as Receipt } from '@helpdesk/contracts';

export function SurveyReceipt({ receipt }: { receipt: Receipt }) {
  return <section role="status" className="space-y-3 rounded-lg border border-border bg-card p-6 text-center">
    <h1 className="text-xl font-semibold">¡Gracias por tu respuesta!</h1>
    <p>Calificaste el ticket <strong>{receipt.numero}</strong> con {receipt.calificacion} de 5.</p>
    <p className="text-sm text-muted">Tu respuesta quedó registrada. Podés cerrar esta ventana.</p>
  </section>;
}
