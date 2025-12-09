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
    adminCreated: {
      title: 'Tu cuenta ha sido creada',
      preview: 'Un administrador ha creado tu cuenta en CIP Eventos.',
      greeting: 'Hola',
      colleague: 'colega',
      intro: 'Un administrador ha creado una cuenta para ti en el sistema de CIP Eventos.',
      credentialsTitle: 'Tus credenciales de acceso',
      email: 'Correo',
      tempPassword: 'Contraseña temporal',
      important: 'Importante',
      securityNote: 'Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.',
      verifyFirst: 'Primero, verifica tu cuenta haciendo clic en el siguiente botón:',
      button: 'Verificar mi cuenta',
      afterVerify: 'Una vez verificada tu cuenta, podrás iniciar sesión con las credenciales proporcionadas.',
      questions: '¿Tienes preguntas? Contacta al administrador del sistema.',
    },
    adminResetPassword: {
      title: 'Tu contraseña ha sido restablecida',
      preview: 'Un administrador ha restablecido tu contraseña en CIP Eventos.',
      greeting: 'Hola',
      colleague: 'colega',
      intro: 'Un administrador ha restablecido la contraseña de tu cuenta en el sistema de CIP Eventos.',
      newPassword: 'Tu nueva contraseña',
      important: 'Importante',
      securityNote: 'Por seguridad, te recomendamos cambiar esta contraseña después de iniciar sesión.',
      button: 'Iniciar sesión',
      questions: '¿Tienes preguntas? Contacta al administrador del sistema.',
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
      adminCreated: 'Tu cuenta ha sido creada',
      adminResetPassword: 'Tu contraseña ha sido restablecida',
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
    adminCreated: {
      title: 'Your account has been created',
      preview: 'An administrator has created your account in CIP Events.',
      greeting: 'Hello',
      colleague: 'colleague',
      intro: 'An administrator has created an account for you in the CIP Events system.',
      credentialsTitle: 'Your access credentials',
      email: 'Email',
      tempPassword: 'Temporary password',
      important: 'Important',
      securityNote: 'For security, we recommend changing your password after your first login.',
      verifyFirst: 'First, verify your account by clicking the button below:',
      button: 'Verify my account',
      afterVerify: 'Once your account is verified, you can log in with the credentials provided.',
      questions: 'Have questions? Contact the system administrator.',
    },
    adminResetPassword: {
      title: 'Your password has been reset',
      preview: 'An administrator has reset your password in CIP Events.',
      greeting: 'Hello',
      colleague: 'colleague',
      intro: 'An administrator has reset your password in the CIP Events system.',
      newPassword: 'Your new password',
      important: 'Important',
      securityNote: 'For security, we recommend changing this password after logging in.',
      button: 'Log in',
      questions: 'Have questions? Contact the system administrator.',
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
      adminCreated: 'Your account has been created',
      adminResetPassword: 'Your password has been reset',
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

// Admin created user
interface AdminCreatedEmailProps {
  name: string;
  email: string;
  tempPassword: string;
  verifyUrl: string;
  locale: 'es' | 'en';
}

const AdminCreatedEmail: React.FC<AdminCreatedEmailProps> = ({ name, email, tempPassword, verifyUrl, locale }) => {
  const t = translations[locale].adminCreated;
  return (
    <BaseLayout title={t.title} preview={t.preview} footer={translations[locale].welcome.footer}>
      <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>{t.greeting} {name || t.colleague},</Text>
      <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>
        {t.intro}
      </Text>

      {/* Credenciales */}
      <Section style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', margin: '20px 0', border: '1px solid #e5e7eb' }}>
        <Text style={{ margin: '0 0 12px', fontWeight: 600, color: '#111827', fontSize: '15px' }}>{t.credentialsTitle}</Text>
        <Text style={{ margin: '6px 0', color: '#4b5563', fontSize: '14px' }}>
          <strong>{t.email}:</strong> {email}
        </Text>
        <Text style={{ margin: '6px 0', color: '#4b5563', fontSize: '14px' }}>
          <strong>{t.tempPassword}:</strong>{' '}
          <span style={{ fontFamily: 'monospace', background: '#e5e7eb', padding: '2px 8px', borderRadius: '4px' }}>{tempPassword}</span>
        </Text>
      </Section>

      {/* Aviso de seguridad */}
      <Section style={{ background: '#FFF3C4', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px', border: '1px solid #F0B429' }}>
        <Text style={{ margin: 0, color: '#8D2B0B', fontWeight: 700 }}>{t.important}</Text>
        <Text style={{ margin: '6px 0 0', color: '#625D52', fontSize: '14px' }}>
          {t.securityNote}
        </Text>
      </Section>

      <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>
        {t.verifyFirst}
      </Text>

      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button style={{ ...baseStyles.button, backgroundColor: '#2CB1BC' }} href={verifyUrl}>
          {t.button}
        </Button>
      </Section>

      <Text style={{ color: '#4b5563', fontSize: '14px', lineHeight: '21px' }}>
        {t.afterVerify}
      </Text>
      <Text style={{ color: '#6b7280', fontSize: '13px', marginTop: '16px' }}>
        {t.questions}
      </Text>
    </BaseLayout>
  );
};

// Admin reset password email
interface AdminResetPasswordEmailProps {
  name: string;
  newPassword: string;
  loginUrl: string;
  locale: 'es' | 'en';
}

const AdminResetPasswordEmail: React.FC<AdminResetPasswordEmailProps> = ({ name, newPassword, loginUrl, locale }) => {
  const t = translations[locale].adminResetPassword;
  return (
    <BaseLayout title={t.title} preview={t.preview} footer={translations[locale].welcome.footer}>
      <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>{t.greeting} {name || t.colleague},</Text>
      <Text style={{ color: '#111827', fontSize: '15px', lineHeight: '22px' }}>
        {t.intro}
      </Text>

      {/* Nueva contraseña */}
      <Section style={{ background: '#f9fafb', borderRadius: '12px', padding: '20px', margin: '20px 0', border: '1px solid #e5e7eb' }}>
        <Text style={{ margin: '0 0 12px', fontWeight: 600, color: '#111827', fontSize: '15px' }}>{t.newPassword}</Text>
        <Text style={{ margin: '6px 0', color: '#4b5563', fontSize: '14px' }}>
          <span style={{ fontFamily: 'monospace', background: '#e5e7eb', padding: '6px 12px', borderRadius: '4px', fontSize: '16px' }}>{newPassword}</span>
        </Text>
      </Section>

      {/* Aviso de seguridad */}
      <Section style={{ background: '#FFF3C4', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px', border: '1px solid #F0B429' }}>
        <Text style={{ margin: 0, color: '#8D2B0B', fontWeight: 700 }}>{t.important}</Text>
        <Text style={{ margin: '6px 0 0', color: '#625D52', fontSize: '14px' }}>
          {t.securityNote}
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <Button style={baseStyles.button} href={loginUrl}>
          {t.button}
        </Button>
      </Section>

      <Text style={{ color: '#6b7280', fontSize: '13px', marginTop: '16px' }}>
        {t.questions}
      </Text>
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

export const renderAdminCreatedEmail = async (
  name: string,
  email: string,
  tempPassword: string,
  verifyUrl: string,
  locale: 'es' | 'en' = 'es',
): Promise<RenderResult> => ({
  subject: translations[locale].subject.adminCreated,
  html: await render(<AdminCreatedEmail name={name} email={email} tempPassword={tempPassword} verifyUrl={verifyUrl} locale={locale} />),
});

export const renderAdminResetPasswordEmail = async (
  name: string,
  newPassword: string,
  loginUrl: string,
  locale: 'es' | 'en' = 'es',
): Promise<RenderResult> => ({
  subject: translations[locale].subject.adminResetPassword,
  html: await render(<AdminResetPasswordEmail name={name} newPassword={newPassword} loginUrl={loginUrl} locale={locale} />),
});

export const renderTicketEmail = async (props: TicketEmailProps): Promise<RenderResult> => ({
  subject: `Tu entrada para ${props.eventTitle}`,
  html: await render(<TicketEmail {...props} />),
});
