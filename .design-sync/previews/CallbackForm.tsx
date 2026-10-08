import { CallbackForm } from '@stiletdekor/ui';

export const Empty = () => <CallbackForm token="3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59" source="/visszahivas" />;

export const WithErrors = () => (
  <CallbackForm
    token="3f8a2b6c-1d4e-4f5a-9b7c-0e1d2c3b4a59"
    values={{ name: '', phone: '123', jobType: 'ceger', message: 'Homlokzati tábla világítással' }}
    errors={{ name: 'Adja meg a nevét.', phone: 'Kérjük, érvényes telefonszámot adjon meg, például +36 70 123 4567.' }}
  />
);
