import React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';

import { Input } from '@/components/ui/rui-input';
import { Button } from '@/components/ui/rui-button';
import { Link } from '@/components/ui/rui-link';
import { getCurrentLocale, routes } from '@/lib/routes';
import { useForgotPasswordForm } from '@/hooks/useForgotPasswordForm';

export default function ForgotPasswordForm() {
  const { t } = useTranslation();
  const { email, setEmail, isLoading, successMessage, errorMessage, handleSubmit } =
    useForgotPasswordForm({ t });

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

  const alertStyles: React.CSSProperties = {
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem',
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h1 style={titleStyles}>{t('forgot.title')}</h1>
        <p style={subtitleStyles}>{t('forgot.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} style={formStyles}>
        <Input
          label={t('forgot.email')}
          type="email"
          name="email"
          placeholder={t('forgot.email_placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          inputSize="lg"
          leftIcon={<Mail size={16} />}
        />

        {errorMessage && (
          <div
            role="alert"
            style={{
              ...alertStyles,
              backgroundColor: 'var(--color-danger-light)',
              color: 'var(--color-danger)',
            }}
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            style={{
              ...alertStyles,
              backgroundColor: 'var(--color-success-light, #E0F7EC)',
              color: 'var(--color-success, #0F9D58)',
            }}
          >
            {successMessage}
          </div>
        )}

        <div style={{ marginTop: 'var(--space-2)' }}>
          <Button type="submit" fullWidth size="lg" isLoading={isLoading} loadingText={t('forgot.loading')}>
            {t('forgot.btn')}
          </Button>
        </div>
      </form>

      <div style={{ textAlign: 'center' }}>
        <Link href={routes[getCurrentLocale()].login} variant="muted">
          {t('forgot.back_to_login')}
        </Link>
      </div>
    </div>
  );
}
