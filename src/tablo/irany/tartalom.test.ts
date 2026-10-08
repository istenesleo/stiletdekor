import { describe, expect, it } from 'vitest';
import { ON_SITE_SERVICE, PRICES_ARE_PLACEHOLDERS, SERVICE_GROUPS } from '@/domain/catalog';
import { COMPANY } from '@/domain/company';
import { grossOf } from '@/domain/pricing';
import { TARTALOM, arSzam, arTeljes } from './tartalom';

describe('the shared content of the full directions', () => {
  it('takes the company, slogan and service groups from the domain', () => {
    expect(TARTALOM.ceg).toBe(COMPANY);
    expect(TARTALOM.szlogen).toBe('Kiszállunk, felmérjük, felszereljük.');
    expect(TARTALOM.szlogen).toBe(ON_SITE_SERVICE.description);
    expect(TARTALOM.csoportok.map((g) => g.nev)).toEqual(SERVICE_GROUPS.map((g) => g.name));
    expect(TARTALOM.csoportok.every((g) => g.elemek.length > 0)).toBe(true);
    expect(TARTALOM.csoportok.flatMap((g) => g.elemek).some((e) => e.online)).toBe(true);
  });

  it('shows the lowest gross catalog prices, marked as placeholders while they are', () => {
    expect(TARTALOM.arak).toEqual([
      { termek: 'Molinó', osszeg: grossOf(3990), egyseg: 'Ft/m²-től' },
      { termek: 'Roll-up', osszeg: grossOf(24900), egyseg: 'Ft-tól' },
      { termek: 'Matrica', osszeg: grossOf(6990), egyseg: 'Ft/m²-től' },
    ]);
    expect(TARTALOM.arakHelyorzok).toBe(PRICES_ARE_PLACEHOLDERS);
  });

  it('formats prices the Hungarian way, with no-break spaces', () => {
    const molino = TARTALOM.arak[0]!;
    expect(arSzam(molino)).toBe('5 067');
    expect(arTeljes(molino)).toBe('5 067 Ft/m²-től');
  });

  it('keeps the four process steps in their real order', () => {
    expect(TARTALOM.folyamat.map((l) => l.cim)).toEqual(['Felmérés', 'Tervezés', 'Gyártás saját műhelyben', 'Telepítés']);
    expect(TARTALOM.gyartasiIdo).toBe('3 munkanap');
  });
});
