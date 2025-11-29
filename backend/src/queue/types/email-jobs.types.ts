export enum EmailJobType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password-reset',
  ACCOUNT_CONFIRMED = 'account-confirmed',
  TICKET = 'ticket',
}

export interface WelcomeEmailJob {
  type: EmailJobType.WELCOME;
  data: {
    email: string;
    name: string;
    token: string;
  };
}

export interface PasswordResetEmailJob {
  type: EmailJobType.PASSWORD_RESET;
  data: {
    email: string;
    name: string;
    token: string;
  };
}

export interface AccountConfirmedEmailJob {
  type: EmailJobType.ACCOUNT_CONFIRMED;
  data: {
    email: string;
    name: string;
  };
}

export interface TicketEmailJob {
  type: EmailJobType.TICKET;
  data: {
    registrationId: string;
  };
}

export type EmailJob =
  | WelcomeEmailJob
  | PasswordResetEmailJob
  | AccountConfirmedEmailJob
  | TicketEmailJob;
