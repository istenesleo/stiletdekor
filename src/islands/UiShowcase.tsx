import type { SiteThemeId } from '@/site/themes';
import { NavLink } from '@/ui';
import { BasicSpecs } from './showcase/BasicSpecs';
import { FormSpecs } from './showcase/FormSpecs';
import './UiShowcase.css';

interface ShowcaseProps {
  theme: SiteThemeId;
  themes: ReadonlyArray<{ id: SiteThemeId; label: string }>;
}

const GROUPS = [
  ['alapelemek', 'Alapelemek'],
  ['urlap', 'Űrlap'],
] as const;

/** The UI library's specimen page: every component in its states, in the selected design direction. */
export default function UiShowcase({ theme, themes }: ShowcaseProps) {
  return (
    <main className="uis">
      <div className="uis-top">
        <h1>Stilet UI · komponensek</h1>
        <nav className="uis-themes" aria-label="Design-irány">
          {themes.map((t) => (
            <NavLink key={t.id} href={`?tema=${t.id}`} current={t.id === theme}>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <nav className="uis-toc" aria-label="Csoportok">
        {GROUPS.map(([id, label]) => (
          <NavLink key={id} href={`#${id}`}>
            {label}
          </NavLink>
        ))}
      </nav>
      <BasicSpecs />
      <FormSpecs />
    </main>
  );
}
