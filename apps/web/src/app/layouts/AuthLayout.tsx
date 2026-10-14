import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-card text-foreground md:grid md:grid-cols-[minmax(280px,38%)_1fr]">
      <aside className="flex flex-col items-center justify-center bg-primary p-8 text-center text-primary-foreground md:min-h-screen md:p-12">
        <svg aria-hidden="true" viewBox="0 0 32 32" className="mb-5 h-14 w-14 fill-none stroke-current" strokeWidth="2"><path d="M16 3 5 8v8c0 6 5 11 11 14 6-3 11-8 11-14V8L16 3Z" /></svg>
        <p className="text-2xl font-bold">EMPROVISA</p>
        <p className="mt-2">Sistema de Mesa de Ayuda</p>
        <p className="mt-6 max-w-xs text-sm leading-6">Prototipo local para demostrar el registro, la atención y el seguimiento del soporte de TI.</p>
        <p className="mt-8 text-sm">Managua · Rivas · León</p>
      </aside>
      <section className="flex items-center justify-center p-6 py-10 md:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
