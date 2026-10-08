// Which part of the /tablo board a URL asks for: ?csoport=<group> narrows it to one group, ?csak=kesz hides
// planned variants, ?beagyazott=1 drops the top bar (the board inside the local "Arculati látványtervek" file).
import { VARIANT_GROUPS, type VariantGroup } from './variants';

export interface BoardView {
  readonly groups: readonly VariantGroup[];
  readonly onlyFinished: boolean;
  readonly embedded: boolean;
}

export function boardView(params: URLSearchParams): BoardView {
  const requested = VARIANT_GROUPS.find((g) => g.id === params.get('csoport'));
  return {
    groups: requested ? [requested.id] : VARIANT_GROUPS.map((g) => g.id),
    onlyFinished: params.get('csak') === 'kesz',
    embedded: params.get('beagyazott') === '1',
  };
}
