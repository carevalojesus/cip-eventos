import { useEffect, useState } from 'react';
import axios from 'axios';
import { type TFunction } from 'react-i18next';

import api from '@/lib/api';

interface UseResetPasswordReturn {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  isLoading: boolean;
  successMessage: string;
  errorMessage: string;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useResetPasswordForm(t: TFunction): UseResetPasswordReturn {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    setToken(tokenParam);
    if (!tokenParam) {
      setErrorMessage(t('reset.missing_token'));
    }
  }, [t]);

  const validate = () => {
    if (!password) {
      setErrorMessage(t('reset.validation.password_required'));
      return false;
    }
    if (password.length < 8) {
      setErrorMessage(t('reset.validation.password_min_length'));
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMessage(t('reset.validation.password_uppercase'));
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setErrorMessage(t('reset.validation.password_number'));
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t('reset.validation.password_match'));
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (isLoading || successMessage) return;

    if (!token) {
      setErrorMessage(t('reset.missing_token'));
      return;
    }

    if (!validate()) return;

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { newPassword: password }, { params: { token } });
      setSuccessMessage(t('reset.success'));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setErrorMessage(Array.isArray(msg) ? msg[0] : msg || t('reset.error'));
      } else {
        setErrorMessage(t('reset.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    successMessage,
    errorMessage,
    handleSubmit,
  };
}
