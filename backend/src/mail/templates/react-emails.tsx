import * as React from 'react';
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { render } from '@react-email/render';

type RenderResult = { subject: string; html: string };

const translations = {
  es: {
    welcome: {
      title: 'Confirma tu cuenta',
      preview: 'Activa tu cuenta para acceder a CIP Eventos.',
      greeting: 'Hola',
      colleague: 'colega',
      thankYou: 'Gracias por registrarte. Confirma tu correo para acceder al panel de eventos.',
      button: 'Confirmar email',
      ignore: 'Si no solicitaste este registro, puedes ignorar este mensaje.',
      footer: 'Colegio de Ingenieros del Perú - Consejo Departamental de Loreto',
    },
    reset: {
      title: 'Restablece tu contraseña',
      preview: 'Recupera el acceso a tu cuenta de CIP Eventos.',
      important: 'Importante',
      expiry: 'Este enlace expira en 1 hora. Úsalo solo si solicitaste el cambio.',
      greeting: 'Hola',
      colleague: 'colega',
      message: 'Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para continuar y crea una nueva.',
      button: 'Crear nueva contraseña',
      ignore: 'Si no solicitaste este cambio, ignora este correo.',
    },
    confirmed: {
      title: 'Cuenta verificada',
      preview: 'Tu correo fue verificado con éxito.',
      greeting: 'Hola',
      colleague: 'colega',
      message: 'Tu correo fue verificado correctamente. Ya puedes iniciar sesión y gestionar tus eventos.',
      button: 'Ir a iniciar sesión',
    },
    subject: {
      welcome: 'Confirma tu cuenta',
      reset: 'Restablecer contraseña',
      confirmed: 'Cuenta verificada',
    },
  },
  en: {
    welcome: {
      title: 'Confirm your account',
      preview: 'Activate your account to access CIP Events.',
      greeting: 'Hello',
      colleague: 'colleague',
      thankYou: 'Thanks for signing up. Confirm your email to access the events panel.',
      button: 'Confirm email',
      ignore: 'If you did not request this registration, you can ignore this message.',
      footer: 'Engineers Association of Peru - Loreto Departmental Council',
    },
    reset: {
      title: 'Reset your password',
      preview: 'Recover access to your CIP Events account.',
      important: 'Important',
      expiry: 'This link expires in 1 hour. Only use it if you requested the change.',
      greeting: 'Hello',
      colleague: 'colleague',
      message: 'We received a request to reset your password. Click the button to continue and create a new one.',
      button: 'Create new password',
      ignore: 'If you did not request this change, ignore this email.',
    },
    confirmed: {
      title: 'Account verified',
      preview: 'Your email was verified successfully.',
      greeting: 'Hello',
      colleague: 'colleague',
      message: 'Your email was verified successfully. You can now sign in and manage your events.',
      button: 'Go to login',
    },
    subject: {
      welcome: 'Confirm your account',
      reset: 'Reset password',
      confirmed: 'Account verified',
    },
  },
};

const baseStyles = {
  body: { margin: 0, padding: 0, backgroundColor: '#f5f5f5', fontFamily: '"Inter", Arial, sans-serif' },
  container: { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' },
  header: { padding: '32px 32px 0', color: '#111827' },
  footer: { padding: '24px 32px', fontSize: '12px', color: '#6b7280' },
  button: { backgroundColor: '#4f46e5', color: '#ffffff', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' },
};

const PreviewText: React.FC<{ children: React.ReactNode }> = ({ children }) => <Preview>{children as string}</Preview>;

const BaseLayout: React.FC<{ title: string; preview: string; footer: string; children: React.ReactNode }> = ({ title, preview, footer, children }) => (
  <Html>
    <Head />
    <PreviewText>{preview}</PreviewText>
    <Body style={baseStyles.body}>
      <Container style={baseStyles.container}>
        <Section style={baseStyles.header}>
          <Heading style={{ fontSize: '24px', margin: 0 }}>{title}</Heading>
          <Text style={{ margin: '12px 0 0', color: '#4b5563', fontSize: '15px', lineHeight: '22px' }}>{preview}</Text>
        </Section>
        <Hr style={{ borderColor: '#e5e7eb', margin: '24px 32px' }} />
        <Section style={{ padding: '0 32px 24px' }}>{children}</Section>
        <Hr style={{ borderColor: '#e5e7eb', margin: '0 32px 16px' }} />
        <Section style={baseStyles.footer}>
          <Text style={{ margin: 0 }}>{footer}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// Welcome / Confirm email
const WelcomeEmail: React.FC<{ name: string; confirmUrl: string; locale: 'es' | 'en' }> = ({ name, confirmUrl, locale }) => {
  const t = translations[locale].welcome;
  return (
    <BaseLayout title={t.title} preview={t.preview} footer={t.footer}>
      <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>{t.greeting} {name || t.colleague},</Text>
      <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>
        {t.thankYou}
      </Text>
      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button style={baseStyles.button} href={confirmUrl}>
          {t.button}
        </Button>
      </Section>
      <Text style={{ color: '#4b5563', fontSize: '14px', lineHeight: '21px' }}>
        {t.ignore}
      </Text>
    </BaseLayout>
  );
};

// Password reset
const ResetPasswordEmail: React.FC<{ name: string; resetUrl: string; locale: 'es' | 'en' }> = ({ name, resetUrl, locale }) => {
  const t = translations[locale].reset;
  return (
    <BaseLayout title={t.title} preview={t.preview} footer={translations[locale].welcome.footer}>
      <Section style={{ background: '#FFEEEE', borderRadius: '12px', padding: '16px 18px', marginBottom: '16px', border: '1px solid #FACDCD' }}>
        <Text style={{ margin: 0, color: '#BA2525', fontWeight: 700 }}>{t.important}</Text>
        <Text style={{ margin: '6px 0 0', color: '#625D52' }}>
          {t.expiry}
        </Text>
      </Section>

      <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>{t.greeting} {name || t.colleague},</Text>
      <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>
        {t.message}
      </Text>
      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button style={{ ...baseStyles.button, backgroundColor: '#BA2525' }} href={resetUrl}>
          {t.button}
        </Button>
      </Section>
      <Text style={{ color: '#4b5563', fontSize: '14px', lineHeight: '21px' }}>
        {t.ignore}
      </Text>
    </BaseLayout>
  );
};

// Account confirmed
const AccountConfirmedEmail: React.FC<{ name: string; loginUrl: string; locale: 'es' | 'en' }> = ({ name, loginUrl, locale }) => {
  const t = translations[locale].confirmed;
  return (
    <BaseLayout title={t.title} preview={t.preview} footer={translations[locale].welcome.footer}>
      <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>{t.greeting} {name || t.colleague},</Text>
      <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>
        {t.message}
      </Text>
      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button style={baseStyles.button} href={loginUrl}>
          {t.button}
        </Button>
      </Section>
    </BaseLayout>
  );
};

// Ticket email
interface TicketEmailProps {
  name: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketCode: string;
  qrCode: string;
  walletLink?: string | null;
}

const TicketEmail: React.FC<TicketEmailProps> = ({
  name,
  eventTitle,
  eventDate,
  eventLocation,
  ticketCode,
  qrCode,
  walletLink,
}) => (
  <Html>
    <Head />
    <PreviewText>Tu entrada para {eventTitle}</PreviewText>
    <Body style={baseStyles.body}>
      <Container style={{ ...baseStyles.container, overflow: 'hidden' }}>
        <Section style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '28px 24px' }}>
          <Heading style={{ color: '#fff', margin: 0, fontSize: '24px' }}>¡Tu entrada está lista!</Heading>
          <Text style={{ color: '#e0e7ff', margin: '8px 0 0' }}>{eventTitle}</Text>
        </Section>

        <Section style={{ padding: '24px' }}>
          <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>Hola {name || 'colega'},</Text>
          <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>Gracias por registrarte. Aquí tienes tu entrada:</Text>

          <Section style={{ background: '#f9fafb', padding: '16px', borderRadius: '10px', marginTop: '16px' }}>
            <Heading style={{ fontSize: '18px', margin: '0 0 8px', color: '#4f46e5' }}>{eventTitle}</Heading>
            <Text style={{ margin: '6px 0', color: '#111827' }}><strong>📅 Fecha:</strong> {eventDate}</Text>
            <Text style={{ margin: '6px 0', color: '#111827' }}><strong>📍 Ubicación:</strong> {eventLocation}</Text>
            <Text style={{ margin: '6px 0', color: '#111827' }}><strong>🎫 Código:</strong> {ticketCode}</Text>
          </Section>

          <Section style={{ textAlign: 'center', marginTop: '20px' }}>
            <Text style={{ marginBottom: '12px', color: '#111827' }}>Presenta este código QR al ingresar:</Text>
            <Img src={qrCode} alt="Código QR" width="200" height="200" style={{ display: 'block', margin: '0 auto', background: '#fff', padding: '12px', borderRadius: '10px' }} />
          </Section>

          {walletLink ? (
            <Section style={{ textAlign: 'center', marginTop: '24px', background: '#f9fafb', padding: '16px', borderRadius: '10px' }}>
              <Text style={{ color: '#4b5563', marginBottom: '12px' }}>¿Tienes Android? Agrega tu entrada a Google Wallet:</Text>
              <Link href={walletLink} target="_blank" rel="noreferrer">
                <Img
                  src="https://developers.google.com/static/wallet/images/add-to-google-wallet-button.svg"
                  alt="Añadir a Google Wallet"
                  width="220"
                  style={{ border: 0 }}
                />
              </Link>
            </Section>
          ) : null}

          <Section style={{ marginTop: '24px' }}>
            <Text style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}><strong>Consejos importantes:</strong></Text>
            <Row>
              <Column>
                <Text style={{ fontSize: '14px', color: '#4b5563', margin: '4px 0' }}>• Llega con 15 minutos de anticipación.</Text>
                <Text style={{ fontSize: '14px', color: '#4b5563', margin: '4px 0' }}>• Ten tu entrada lista (digital o impresa).</Text>
                <Text style={{ fontSize: '14px', color: '#4b5563', margin: '4px 0' }}>• No compartas tu código de entrada.</Text>
              </Column>
            </Row>
          </Section>
        </Section>

        <Hr style={{ borderColor: '#e5e7eb', margin: '0 24px 16px' }} />
        <Section style={baseStyles.footer}>
          <Text style={{ margin: 0 }}>¿Tienes preguntas? Contáctanos o visita nuestra web.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const renderWelcomeEmail = async (name: string, confirmUrl: string, locale: 'es' | 'en' = 'es'): Promise<RenderResult> => ({
  subject: translations[locale].subject.welcome,
  html: await render(<WelcomeEmail name={name} confirmUrl={confirmUrl} locale={locale} />),
});

export const renderResetPasswordEmail = async (name: string, resetUrl: string, locale: 'es' | 'en' = 'es'): Promise<RenderResult> => ({
  subject: translations[locale].subject.reset,
  html: await render(<ResetPasswordEmail name={name} resetUrl={resetUrl} locale={locale} />),
});

export const renderAccountConfirmedEmail = async (name: string, loginUrl: string, locale: 'es' | 'en' = 'es'): Promise<RenderResult> => ({
  subject: translations[locale].subject.confirmed,
  html: await render(<AccountConfirmedEmail name={name} loginUrl={loginUrl} locale={locale} />),
});

export const renderTicketEmail = async (props: TicketEmailProps): Promise<RenderResult> => ({
  subject: `Tu entrada para ${props.eventTitle}`,
  html: await render(<TicketEmail {...props} />),
});
