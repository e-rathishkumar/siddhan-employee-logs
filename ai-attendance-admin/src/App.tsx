import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ToastContainer } from './shared/components';
import { useI18nStore } from './stores/i18nStore';

export default function App() {
  const { locale, loadMessages } = useI18nStore();

  useEffect(() => {
    loadMessages(locale);
  }, [locale, loadMessages]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}
