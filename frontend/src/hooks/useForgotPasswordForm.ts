import { useState } from 'react';
import axios from 'axios';
import { type TFunction } from 'react-i18next';

import api from '@/lib/api';

interface UseForgotPasswordParams {
  t: TFunction;
}

interface UseForgotPasswordReturn {
  email: string;
  setEmail: (value: string) => void;
  isLoading: boolean;
  successMessage: string;
  errorMessage: string;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useForgotPasswordForm({ t }: UseForgotPasswordParams): UseForgotPasswordReturn {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email) {
      setErrorMessage(t('login.validation.email_required'));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage(t('login.validation.email_invalid'));
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccessMessage(t('forgot.success'));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setErrorMessage(Array.isArray(msg) ? msg[0] : msg || t('forgot.error'));
      } else {
        setErrorMessage(t('forgot.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    isLoading,
    successMessage,
    errorMessage,
    handleSubmit,
  };
}
