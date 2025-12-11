import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import axios from 'axios';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { getCurrentLocale, routes } from '@/lib/routes';
import api from '@/lib/api';

export default function ChangePasswordForm() {
  return (
    <I18nProvider>
      <ChangePasswordFormContent />
    </I18nProvider>
  );
}

function ChangePasswordFormContent() {
  const { t } = useTranslation();
  const locale = getCurrentLocale();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): string | null => {
    if (!currentPassword) {
      return t('change_password.validation.current_required', 'Ingresa tu contraseña actual');
    }
    if (!newPassword) {
      return t('change_password.validation.new_required', 'Ingresa la nueva contraseña');
    }
    if (newPassword.length < 8) {
      return t('change_password.validation.min_length', 'La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(newPassword)) {
      return t('change_password.validation.uppercase', 'La contraseña debe contener al menos una mayúscula');
    }
    if (!/[0-9]/.test(newPassword)) {
      return t('change_password.validation.number', 'La contraseña debe contener al menos un número');
    }
    if (newPassword !== confirmPassword) {
      return t('change_password.validation.mismatch', 'Las contraseñas no coinciden');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        window.location.href = routes[locale].home;
      }, 1500);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || t('errors.network', 'Error de red');
        setError(Array.isArray(msg) ? msg[0] : msg);
      } else {
        setError(t('errors.unknown', 'Error desconocido'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-8)',
    width: '100%',
    maxWidth: '360px',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--color-grey-900)',
    margin: 0,
    lineHeight: 1.3,
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: '16px',
    color: 'var(--color-grey-500)',
    margin: 0,
    lineHeight: 1.6,
  };

  const formStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-5)',
  };

  const messageStyles = (isError: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3)',
    backgroundColor: isError ? 'var(--color-red-050)' : 'var(--color-green-050)',
    color: isError ? 'var(--color-red-600)' : 'var(--color-green-600)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
  });

  if (success) {
    return (
      <div style={containerStyles}>
        <div style={messageStyles(false)} role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{t('change_password.success', 'Contraseña cambiada exitosamente. Redirigiendo...')}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h1 style={titleStyles}>{t('change_password.title', 'Cambiar Contraseña')}</h1>
        <p style={subtitleStyles}>
          {t('change_password.subtitle', 'Por seguridad, debes cambiar tu contraseña antes de continuar.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={formStyles}>
        <Input
          label={t('change_password.current', 'Contraseña actual')}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={t('change_password.current_placeholder', 'Ingresa tu contraseña actual')}
          inputSize="lg"
          leftIcon={<Lock size={16} />}
          showPasswordToggle
        />

        <Input
          label={t('change_password.new', 'Nueva contraseña')}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t('change_password.new_placeholder', 'Ingresa la nueva contraseña')}
          inputSize="lg"
          leftIcon={<Lock size={16} />}
          showPasswordToggle
        />

        <Input
          label={t('change_password.confirm', 'Confirmar contraseña')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('change_password.confirm_placeholder', 'Confirma la nueva contraseña')}
          inputSize="lg"
          leftIcon={<Lock size={16} />}
          showPasswordToggle
        />

        {error && (
          <div style={messageStyles(true)} role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          loadingText={t('change_password.loading', 'Cambiando...')}
        >
          {t('change_password.submit', 'Cambiar Contraseña')}
        </Button>
      </form>
    </div>
  );
}
