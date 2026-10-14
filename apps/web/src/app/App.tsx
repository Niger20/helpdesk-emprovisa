import { BrowserRouter } from 'react-router';
import { QueryProvider } from './providers/QueryProvider';
import { AppRoutes } from './router/routes';
import { AuthProvider } from './providers/AuthProvider';

export function App() {
  return <QueryProvider><BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter></QueryProvider>;
}
