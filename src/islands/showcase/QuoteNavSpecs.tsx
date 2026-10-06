import { useState } from 'react';
import { QUOTE_TYPES } from '@/domain/catalog';
import { jobTypeOption } from '@/site/catalog-ui';
import { Button, ButtonLink, ContactBlock, JobTypePicker, SiteFooter, SiteHeader, Stepper, SuccessPanel, Wordmark } from '@/ui';
import { Cell, Group, Spec } from './parts';

const STEPS = ['Típus', 'Részletek', 'Helyszín és fotók', 'Kapcsolat'] as const;
const JOB_TYPES = QUOTE_TYPES.map(jobTypeOption);

interface QuoteNavSpecsProps {
  /** Opens the sample cart drawer (Webshop és rendelés). */
  onCartClick: () => void;
}

/** Quote wizard, navigation and content components with working state. */
export function QuoteNavSpecs({ onCartClick }: QuoteNavSpecsProps) {
  const [step, setStep] = useState(1);
  const [reached, setReached] = useState(1);
  const [jobType, setJobType] = useState<string>('kirakat');

  const goTo = (index: number) => {
    setStep(index);
    setReached((r) => Math.max(r, index));
  };

  return (
    <>
      <Group id="ajanlatkeres" title="Ajánlatkérés és navigáció" />
      <Spec title="Lépésjelző · Stepper" desc="Az elért lépésekre vissza lehet lépni; telefonon csak az aktuális lépés neve látszik." wide>
        <Cell caption="interaktív">
          <div className="uis-stack">
            <Stepper steps={STEPS} current={step} reached={reached} onStepClick={goTo} />
            <div className="uis-row">
              <Button variant="secondary" size="sm" disabled={step === 0} onClick={() => goTo(step - 1)}>
                Vissza
              </Button>
              <Button size="sm" disabled={step === STEPS.length - 1} onClick={() => goTo(step + 1)}>
                Tovább
              </Button>
            </div>
          </div>
        </Cell>
        <Cell caption="első lépés">
          <Stepper steps={STEPS} current={0} />
        </Cell>
        <Cell caption="utolsó lépés">
          <Stepper steps={STEPS} current={3} onStepClick={() => {}} />
        </Cell>
      </Spec>

      <Spec title="Munkatípus · JobTypePicker" desc="Az ajánlatkérő első lépése: a 9 egyedi munkatípus a katalógusból." full>
        <Cell caption="egy kiválasztva">
          <JobTypePicker types={JOB_TYPES} value={jobType} onChange={setJobType} />
        </Cell>
      </Spec>

      <Spec title="Sikerállapot · SuccessPanel" wide>
        <Cell caption="ajánlatkérés után">
          <SuccessPanel
            title="Megkaptuk az ajánlatkérését"
            reference="AK-2026-0142"
            nextSteps={[
              'Átnézzük a leírást és a fotókat.',
              'Egy munkanapon belül visszahívjuk, és ha kell, egyeztetjük a helyszíni felmérést.',
              'E-mailben elküldjük az árajánlatot.',
            ]}
            note="A végleges árajánlat eltérhet a kalkulált ártól."
            actions={
              <>
                <ButtonLink href="#ajanlatkeres" variant="secondary">
                  Vissza a kezdőlapra
                </ButtonLink>
                <Button variant="ghost">Új ajánlatkérés</Button>
              </>
            }
          />
        </Cell>
        <Cell caption="rendelés után">
          <SuccessPanel
            title="Megkaptuk a rendelését"
            reference="R-2026-0087"
            referenceLabel="Rendelésszám"
            nextSteps={[
              'Ellenőrizzük a fájlokat és a méreteket.',
              'Díjbekérőt küldünk e-mailben; a befizetésével fogadja el a rendelést.',
              'A befizetés után gyártjuk, és értesítjük, amikor elkészült.',
            ]}
          >
            <p>A visszaigazolást elküldtük a megadott e-mail-címre.</p>
          </SuccessPanel>
        </Cell>
      </Spec>

      <Spec
        title="Fejléc · SiteHeader"
        desc="Ennek az oldalnak a tetején élőben látható, tapadó módon. 1040 px alatt a menü egy panelbe kerül; a telefonszám 1240 px felett jelenik meg."
        full
      >
        <Cell caption="széles, a Webshop az aktuális oldal">
          <SiteHeader sticky={false} skipTo={null} currentHref="/#webshop" cartCount={2} onCartClick={onCartClick} />
        </Cell>
        <Cell caption="telefonon, nyitott menüvel">
          <div className="uis-phone">
            <SiteHeader sticky={false} skipTo={null} defaultMenuOpen cartCount={2} onCartClick={onCartClick} />
          </div>
        </Cell>
      </Spec>

      <Spec title="Lábléc · SiteFooter" desc="Széles változata ennek az oldalnak az alján látható." full>
        <Cell caption="telefonon">
          <div className="uis-phone uis-phone--auto">
            <SiteFooter />
          </div>
        </Cell>
      </Spec>

      <Spec title="Elérhetőség · ContactBlock · Szómárka · Wordmark" wide>
        <Cell caption="a műhely adatai, másolás gombbal">
          <ContactBlock />
        </Cell>
        <Cell caption="szómárka (a logó helyén)">
          <Wordmark href="#ajanlatkeres" />
        </Cell>
      </Spec>
    </>
  );
}
