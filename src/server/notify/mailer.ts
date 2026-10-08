// How the site's e-mails leave: through the Workers send_email binding (Cloudflare Email Service) once the
// stiletdekor.hu domain is on Cloudflare, and into the log until then (README, "Értesítő e-mailek").

/** An e-mail to the workshop. */
export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export interface Mailer {
  send(email: OutgoingEmail): Promise<void>;
}

/** Writes the e-mail to the log instead of sending it: local development, and deployments without the binding. */
export function logMailer(log: (line: string) => void = (line) => console.info(line)): Mailer {
  return {
    async send(email) {
      log(`[értesítés → ${email.to}] ${email.subject}\n${email.text}`);
    },
  };
}

/** Sends through the send_email binding; `from` must be an address on a domain onboarded to Email Service. */
export function bindingMailer(binding: Pick<SendEmail, 'send'>, from: string): Mailer {
  return {
    async send(email) {
      await binding.send({
        from: { email: from, name: 'Stilet Dekor weboldal' },
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(email.replyTo ? { replyTo: email.replyTo } : {}),
      });
    },
  };
}

/** The mailer this deployment can use: the binding when it and the sender address are configured, else the log. */
export function mailerFor(env: { EMAIL?: Pick<SendEmail, 'send'>; NOTIFY_FROM_EMAIL?: string }): Mailer {
  return env.EMAIL && env.NOTIFY_FROM_EMAIL ? bindingMailer(env.EMAIL, env.NOTIFY_FROM_EMAIL) : logMailer();
}
