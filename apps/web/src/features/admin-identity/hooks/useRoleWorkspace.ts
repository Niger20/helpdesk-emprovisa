import { useState } from 'react';
export function useRoleWorkspace() { const [id, setId] = useState(0); return { id, select: (value: string) => setId(Number(value)) }; }
