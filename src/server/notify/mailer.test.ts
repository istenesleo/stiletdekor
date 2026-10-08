import { describe, expect, it, vi } from 'vitest';
import { bindingMailer, logMailer, mailerFor, type OutgoingEmail } from './mailer';

const EMAIL: OutgoingEmail = { to: 'muhely@example.com', subject: '[VH-0001] Visszahívás – Kiss Péter', text: 'Szöveg', html: '<p>Szöveg</p>' };

describe('mailers', () => {
  it('writes the e-mail to the log when there is no sending binding', async () => {
    const log = vi.fn();
    await logMailer(log).send(EMAIL);
    expect(log).toHaveBeenCalledWith('[értesítés → muhely@example.com] [VH-0001] Visszahívás – Kiss Péter\nSzöveg');
  });

  it('sends through the binding from the site address, with the reply-to when given', async () => {
    const send = vi.fn().mockResolvedValue({ messageId: 'x' });
    await bindingMailer({ send }, 'ertesito@stiletdekor.hu').send({ ...EMAIL, replyTo: 'ugyfel@example.com' });
    expect(send).toHaveBeenCalledWith({
      from: { email: 'ertesito@stiletdekor.hu', name: 'Stilet Dekor weboldal' },
      to: 'muhely@example.com',
      subject: EMAIL.subject,
      text: 'Szöveg',
      html: '<p>Szöveg</p>',
      replyTo: 'ugyfel@example.com',
    });
  });

  it('uses the binding only when both it and the sender address are configured', async () => {
    const send = vi.fn().mockResolvedValue({ messageId: 'x' });
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    await mailerFor({ EMAIL: { send }, NOTIFY_FROM_EMAIL: '' }).send(EMAIL);
    expect(send).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledOnce();
    await mailerFor({ EMAIL: { send }, NOTIFY_FROM_EMAIL: 'ertesito@stiletdekor.hu' }).send(EMAIL);
    expect(send).toHaveBeenCalledOnce();
    info.mockRestore();
  });
});
