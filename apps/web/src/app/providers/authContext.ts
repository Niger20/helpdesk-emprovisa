import { createContext } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { SesionResponse } from '@helpdesk/contracts';

export const AuthContext = createContext<UseQueryResult<SesionResponse | null, Error> | null>(null);
