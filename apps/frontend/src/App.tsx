import { Toaster } from 'sonner';
import AppRouter from './router/AppRouter';

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </>
  );
}