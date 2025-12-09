import { useEffect, useState, type ReactNode } from 'react';
import '@/i18n'; // Importar i18n primero
import i18n from '@/i18n';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (i18n.isInitialized) {
      setIsReady(true);
      return;
    }

    const handleInitialized = () => setIsReady(true);
    i18n.on('initialized', handleInitialized);

    return () => {
      i18n.off('initialized', handleInitialized);
    };
  }, []);

  // Mientras i18n no esté listo, no renderizar nada
  // Esto evita el flash de claves de traducción
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
