import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';

import { Input } from '@/components/ui/rui-input';
import { Button } from '@/components/ui/rui-button';
import { Link } from '@/components/ui/rui-link';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { getCurrentLocale, routes } from '@/lib/routes';
import { useResetPasswordForm } from '@/hooks/useResetPasswordForm';

// Wrapper con I18nProvider para asegurar que i18n está listo
export default function ResetPasswordForm() {
  return (
    <I18nProvider>
      <ResetPasswordFormContent />
    </I18nProvider>
  );
}

function ResetPasswordFormContent() {
  const { t } = useTranslation();
  const locale = getCurrentLocale();
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    successMessage,
    errorMessage,
    handleSubmit,
  } = useResetPasswordForm(t);
  const hasScheduledRedirect = React.useRef(false);

  React.useEffect(() => {
    if (successMessage && !hasScheduledRedirect.current) {
      hasScheduledRedirect.current = true;
      const timeout = window.setTimeout(() => {
        window.location.href = routes[locale].login;
      }, 1500);
      return () => window.clearTimeout(timeout);
    }
  }, [successMessage, locale]);

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
        <h1 style={titleStyles}>{t('reset.title')}</h1>
        <p style={subtitleStyles}>{t('reset.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} style={formStyles}>
        <Input
          label={t('reset.password')}
          type="password"
          name="password"
          placeholder={t('reset.password_placeholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          inputSize="lg"
          leftIcon={<Lock size={16} />}
          showPasswordToggle
          showPasswordLabel={t('login.show_password')}
          hidePasswordLabel={t('login.hide_password')}
        />

        <Input
          label={t('reset.confirm_password')}
          type="password"
          name="confirm_password"
          placeholder={t('reset.password_placeholder')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          inputSize="lg"
          leftIcon={<Lock size={16} />}
          showPasswordToggle
          showPasswordLabel={t('login.show_password')}
          hidePasswordLabel={t('login.hide_password')}
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
              backgroundColor: 'var(--color-success-light)',
              color: 'var(--color-success-dark)',
            }}
          >
            {successMessage}
          </div>
        )}

        <div style={{ marginTop: 'var(--space-2)' }}>
          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            disabled={isLoading || !!successMessage}
            loadingText={t('reset.loading')}
          >
            {t('reset.btn')}
          </Button>
        </div>
      </form>

      <div style={{ textAlign: 'center' }}>
        <Link href={routes[locale].login} variant="muted">
          {t('reset.cta_login')}
        </Link>
      </div>
    </div>
  );
}
