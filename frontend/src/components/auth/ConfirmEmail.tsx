import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import api from '@/lib/api';
import { Button } from '@/components/ui/rui-button';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { getCurrentLocale, routes } from '@/lib/routes';

type Status = 'idle' | 'loading' | 'success' | 'error';

// Wrapper con I18nProvider para asegurar que i18n está listo
export default function ConfirmEmail() {
  return (
    <I18nProvider>
      <ConfirmEmailContent />
    </I18nProvider>
  );
}

function ConfirmEmailContent() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const locale = getCurrentLocale();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage(t('confirm.missing_token'));
      return;
    }

    const verify = async () => {
      setStatus('loading');
      try {
        const { data } = await api.get('/auth/confirm', { params: { token } });
        const msg = data?.message || t('confirm.success');
        setStatus('success');
        setMessage(msg);
      } catch (err) {
        setStatus('error');
        if (axios.isAxiosError(err)) {
          const msg = err.response?.data?.message;
          const text = Array.isArray(msg) ? msg[0] : msg;
          setMessage(text || t('confirm.invalid'));
        } else {
          setMessage(t('confirm.invalid'));
        }
      }
    };

    void verify();
  }, [t]);

  const title = t('confirm.title');
  const subtitle = t('confirm.subtitle');

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-5)',
    width: '100%',
    maxWidth: '420px',
  };

  const cardStyles: React.CSSProperties = {
    padding: 'var(--space-6)',
    backgroundColor: 'white',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-ml)',
    border: '1px solid var(--color-grey-200)',
  };

  const statusColor =
    status === 'success'
      ? { color: 'var(--color-success)' }
      : status === 'error'
      ? { color: 'var(--color-danger)' }
      : { color: 'var(--color-grey-600)' };

  return (
    <div style={containerStyles}>
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--color-grey-900)', fontWeight: 700 }}>{title}</h1>
        <p style={{ marginTop: '8px', color: 'var(--color-grey-500)', lineHeight: 1.6 }}>{subtitle}</p>
      </div>

      <div style={cardStyles}>
        <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.5, ...statusColor }}>
          {status === 'loading' ? t('confirm.loading') : message || t('confirm.success')}
        </p>
      </div>

      <Button
        type="button"
        fullWidth
        size="lg"
        onClick={() => {
          window.location.href = routes[locale].login;
        }}
      >
        {t('confirm.cta')}
      </Button>
    </div>
  );
}
