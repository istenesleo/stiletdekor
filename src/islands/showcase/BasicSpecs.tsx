import { ORDER_STATUS_IDS } from '@/domain/orders';
import {
  Badge,
  Button,
  ButtonLink,
  DimensionLine,
  Divider,
  Icon,
  ICON_NAMES,
  IconButton,
  NavLink,
  Notice,
  OrderStatusBadge,
  SectionHeader,
  TextLink,
} from '@/ui';
import { Cell, Group, Spec } from './parts';

const SAMPLE = 'Árvíztűrő tükörfúrógép, ŐŰ, 12 990 Ft, 85×200 cm';

/** Type sample and the basic components. */
export function BasicSpecs() {
  return (
    <>
      <Group id="alapelemek" title="Alapelemek" />
      <Spec title="Betűk" desc="Minden betűtípusnak helyesen kell rajzolnia a magyar ékezeteket és a tipográfiai jeleket.">
        <Cell caption="display · body · mono">
          <div className="uis-type">
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', lineHeight: 1.15 }}>{SAMPLE}</p>
            <p>{SAMPLE}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>{SAMPLE}</p>
          </div>
        </Cell>
      </Spec>

      <Spec title="Gomb · Button, ButtonLink" desc="Nézetenként egy elsődleges gomb; a többi másodlagos vagy szellem.">
        {(['primary', 'secondary', 'ghost', 'link'] as const).map((variant) => (
          <Cell key={variant} caption={variant}>
            <div className="uis-row">
              <Button variant={variant}>Kosárba</Button>
              <Button variant={variant} icon="arrow-right" iconPosition="end">
                Tovább
              </Button>
            </div>
            <div className="uis-row">
              <Button variant={variant} disabled>
                Tiltott
              </Button>
              <Button variant={variant} loading>
                Küldés
              </Button>
            </div>
            <div className="uis-row">
              <Button variant={variant} size="sm" icon="upload">
                Kicsi
              </Button>
            </div>
          </Cell>
        ))}
        <Cell caption="block · ButtonLink">
          <Button block icon="cart">
            Rendelés elküldése ellenőrzésre
          </Button>
          <ButtonLink href="#webshop" variant="ghost" icon="arrow-right" iconPosition="end">
            Webshop megnyitása
          </ButtonLink>
        </Cell>
      </Spec>

      <Spec title="Ikongomb · IconButton">
        <Cell caption="kosár: 0 · 3 · 120 tétel">
          <div className="uis-row">
            <IconButton icon="cart" label="Kosár megnyitása, 0 tétel" count={0} />
            <IconButton icon="cart" label="Kosár megnyitása, 3 tétel" count={3} />
            <IconButton icon="cart" label="Kosár megnyitása, 120 tétel" count={120} />
          </div>
        </Cell>
        <Cell caption="menü (nyitva) · bezárás · csere">
          <div className="uis-row">
            <IconButton icon="menu" label="Menü" pressed />
            <IconButton icon="close" label="Bezárás" variant="plain" />
            <IconButton icon="swap" label="Szélesség és magasság cseréje" size="sm" />
            <IconButton icon="trash" label="Tétel törlése" size="sm" disabled />
          </div>
        </Cell>
      </Spec>

      <Spec title="Link · TextLink, NavLink">
        <Cell caption="szövegközi">
          <p style={{ margin: 0 }}>
            A rendeléssel elfogadja az <TextLink href="#aszf">ÁSZF-et</TextLink>. Útvonal a{' '}
            <TextLink href="https://maps.google.com" external>
              térképen
            </TextLink>
            .
          </p>
        </Cell>
        <Cell caption="navigáció, aktív állapottal">
          <nav className="uis-row" aria-label="Minta menü">
            <NavLink href="#szolgaltatasok">Szolgáltatások</NavLink>
            <NavLink href="#webshop" current>
              Webshop
            </NavLink>
            <NavLink href="#referenciak">Referenciák</NavLink>
          </nav>
        </Cell>
      </Spec>

      <Spec title="Jelvény · Badge, OrderStatusBadge">
        <Cell caption="tónusok">
          <div className="uis-row">
            <Badge>Webshop</Badge>
            <Badge tone="brand">Expressz</Badge>
            <Badge tone="placeholder">Helyőrző</Badge>
            <Badge tone="ok">Kiváló</Badge>
            <Badge tone="warn">Megfelelő</Badge>
            <Badge tone="bad">Gyenge</Badge>
            <Badge tone="brand" solid>
              −10%
            </Badge>
          </div>
        </Cell>
        <Cell caption="rendelés állapota">
          <div className="uis-row">
            {ORDER_STATUS_IDS.map((id) => (
              <OrderStatusBadge key={id} status={id} />
            ))}
          </div>
        </Cell>
      </Spec>

      <Spec title="Értesítősáv · Notice" wide>
        <Cell caption="info">
          <Notice>A végleges ár eltérhet a kalkulált ártól.</Notice>
        </Cell>
        <Cell caption="siker, címmel">
          <Notice tone="success" title="Kosárba tettük">
            Molinó, 200×100 cm, 1 db.
          </Notice>
        </Cell>
        <Cell caption="figyelmeztetés">
          <Notice tone="warning" title="A kép aránya eltér">
            Válasszon: kitöltés (vágással) vagy illesztés (kerettel).
          </Notice>
        </Cell>
        <Cell caption="hiba">
          <Notice tone="error">A fájlt nem sikerült megnyitni. Próbálja PDF, PNG vagy JPG formátumban.</Notice>
        </Cell>
      </Spec>

      <Spec title="Elválasztó · Divider · Szakaszfejléc · SectionHeader" wide>
        <Cell caption="hajszálvonal, címkével">
          <p style={{ margin: 0 }}>Tételek</p>
          <Divider />
          <Divider label="Átvétel" />
        </Cell>
        <Cell caption="szakaszfejléc: nagy és kicsi">
          <SectionHeader
            eyebrow="Webshop · azonnali ár"
            title="Rendelje meg online"
            lead="Méret, anyag, grafika: az árat és a határidőt azonnal látja."
          />
          <SectionHeader size="sm" level={3} eyebrow="Folyamat" title="Négy lépés, egy csapat" />
        </Cell>
      </Spec>

      <Spec title="Méretvonal · DimensionLine" desc="A mérés nyelve: nyílhegy, végjel, milliméter, a mérés színével.">
        <Cell caption="vízszintes">
          <DimensionLine valueMm={4200} />
          <div style={{ width: '60%' }}>
            <DimensionLine valueMm={850} />
          </div>
        </Cell>
        <Cell caption="függőleges">
          <div className="uis-row" style={{ height: 160, alignItems: 'stretch' }}>
            <DimensionLine orientation="vertical" valueMm={2000} />
            <DimensionLine orientation="vertical" label="85 cm" />
          </div>
        </Cell>
      </Spec>

      <Spec title="Ikonok · Icon" wide>
        <Cell caption={`${ICON_NAMES.length} ikon`}>
          <div className="uis-icons">
            {ICON_NAMES.map((name) => (
              <span key={name}>
                <Icon name={name} />
                {name}
              </span>
            ))}
          </div>
        </Cell>
      </Spec>
    </>
  );
}
