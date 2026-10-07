import { useState } from 'react';
import { OrderSubmit } from '@stiletdekor/ui';

export const Default = () => {
  const [accepted, setAccepted] = useState(false);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  return (
    <OrderSubmit
      accepted={accepted}
      onAcceptedChange={setAccepted}
      error={tried && !accepted ? 'Az ÁSZF elfogadása nélkül nem küldhető el a rendelés.' : undefined}
      loading={sending}
      onSubmit={() => {
        setTried(true);
        if (accepted) setSending(true);
      }}
    />
  );
};

export const NotAccepted = () => (
  <OrderSubmit accepted={false} onAcceptedChange={() => {}} error="Az ÁSZF elfogadása nélkül nem küldhető el a rendelés." onSubmit={() => {}} />
);

export const Sending = () => <OrderSubmit accepted onAcceptedChange={() => {}} loading onSubmit={() => {}} />;
