// The variants on the /tablo board (docs/superpowers/specs/2026-10-07-tablo-design.md). The page renders this
// list in order; a finished variant ('kesz') has its component at src/tablo/<file> and a line in Variant.astro.

export type VariantGroup = 'hero' | 'szolgaltatas' | 'folyamat' | 'referencia' | 'grafika';
export type VariantLane = 'tokenes' | 'kiserleti';
export type VariantStatus = 'kesz' | 'tervezett';

export interface Variant {
  /** Short code used when choosing winners, e.g. "H2", "R-K1". */
  readonly id: string;
  readonly group: VariantGroup;
  readonly lane: VariantLane;
  readonly name: string;
  /** One sentence: what the idea is. */
  readonly idea: string;
  /** What is new compared with the two mockups in design/mockups/. */
  readonly novelty: string;
  /** Experimental lane only: which rule it steps over. */
  readonly breaks?: string;
  /** Experimental lane only: values outside the tokens, proposed as new tokens if it wins. */
  readonly tokenProposals?: readonly string[];
  /** Build round: 1 graphics, 2 hero, 3 services and process, 4 references, 5 experiments. */
  readonly round: 1 | 2 | 3 | 4 | 5;
  readonly status: VariantStatus;
  /** The variant's component relative to src/tablo, e.g. "grafika/G1Jelenetek.astro". */
  readonly file: string;
}

export const VARIANT_GROUPS: readonly { readonly id: VariantGroup; readonly label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'szolgaltatas', label: 'Szolgáltatások' },
  { id: 'folyamat', label: 'Folyamat' },
  { id: 'referencia', label: 'Referenciák' },
  { id: 'grafika', label: 'Grafikák és motívumok' },
];

export const LANES = ['tokenes', 'kiserleti'] as const satisfies readonly VariantLane[];

export const LANE_LABELS: Readonly<Record<VariantLane, string>> = { tokenes: 'Tokenes', kiserleti: 'Kísérleti' };

export const VARIANTS: readonly Variant[] = [
  // Hero
  {
    id: 'H1', group: 'hero', lane: 'tokenes', round: 2, status: 'tervezett', file: 'hero/H1GyartasiRajz.astro',
    name: 'Gyártási rajz',
    idea: 'A hero egy műhelyi gyártási rajz: a cím a terv, körülötte méretvonalak, M 1:10, a sarokban rajzfej; a két belépő a rajzfej két sora.',
    novelty: 'A mostani heroban illusztrált cégér van; itt maga a hero a műhely rajza.',
  },
  {
    id: 'H2', group: 'hero', lane: 'tokenes', round: 2, status: 'tervezett', file: 'hero/H2KetAjto.astro',
    name: 'Két ajtó',
    idea: 'Két egyenrangú fél: Online rendelés anyagmintával és valós „-tól” bruttó árral, Egyedi ajánlat munkatípus-piktogramokkal; a cím átível.',
    novelty: 'A belépők nem a cím alatti gombok, hanem maguk alkotják a herót.',
  },
  {
    id: 'H3', group: 'hero', lane: 'tokenes', round: 2, status: 'tervezett', file: 'hero/H3AzonnaliAr.astro',
    name: 'Azonnali ár',
    idea: 'Molinó-gyorskalkulátor a heroban: szélesség × magasság → bruttó ár és várható elkészülés, a meglévő árazó és határidő-logikából.',
    novelty: 'A látogató az első képernyőn árat kap, görgetés és aloldal nélkül.',
  },
  {
    id: 'H4', group: 'hero', lane: 'tokenes', round: 2, status: 'tervezett', file: 'hero/H4Anyagfal.astro',
    name: 'Anyagfal',
    idea: 'A háttér valós anyagminták csempéiből áll (frontlit és hálós molinó, perforált fólia, plexi, dibond) valós adatokkal; a cím rajta.',
    novelty: 'Illusztráció helyett az anyagok, a kézművesség tapintható háttere.',
  },
  {
    id: 'H-K1', group: 'hero', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'hero/HK1EloCeger.astro',
    name: 'Élő cégér',
    idea: 'A látogató beírja a cégnevét, és világító betűs cégérként látja nappal és éjjel, méretjelöléssel; innen kitöltött ajánlatkérés.',
    novelty: 'Személyre szabott, interaktív hero, amely egyből ajánlatkéréshez vezet.',
    breaks: 'Új fény- és perspektívaeffektek a tokeneken túl.',
    tokenProposals: ['neoncső fénye (többrétegű árnyék)', 'perspektíva-dőlés'],
  },
  {
    id: 'H-K2', group: 'hero', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'hero/HK2Foliafelhordas.astro',
    name: 'Fóliafelhordás',
    idea: 'Nagy, változó betűs cím; a „felszereljük” szót egy simítólapát húzza fel, mint a fóliát, egyetlen mozdulattal.',
    novelty: 'Az oldal megkomponált mozgása a szakma mozdulatából születik.',
    breaks: 'Új, változó betűtípus és saját mozgás.',
    tokenProposals: ['változó display betű szélesség-tengellyel'],
  },
  // Szolgáltatások
  {
    id: 'SZ1', group: 'szolgaltatas', lane: 'tokenes', round: 3, status: 'tervezett', file: 'szolgaltatas/SZ1Feluletek.astro',
    name: 'Mit szeretne dekorálni?',
    idea: 'Belépés felület szerint (autó, kirakat és üveg, homlokzat és cégér, pult, rendezvény, nyomtatott termék); választás után a hozzá tartozó szolgáltatások, jelölve: online vagy ajánlatra.',
    novelty: 'A látogató nyelvén indul, nem a szakmai csoportokból.',
  },
  {
    id: 'SZ2', group: 'szolgaltatas', lane: 'tokenes', round: 3, status: 'tervezett', file: 'szolgaltatas/SZ2KetSav.astro',
    name: 'Azonnal rendelhető / Ajánlatra',
    idea: 'Két sáv: a 6 webshop-termék valós bruttó „-tól” árral és 3 munkanapos gyártással; az egyedi munkák „Kérjen ajánlatot” gombbal.',
    novelty: 'A hibrid modell (webshop + ajánlat) egy pillantásra érthető.',
  },
  {
    id: 'SZ3', group: 'szolgaltatas', lane: 'tokenes', round: 3, status: 'tervezett', file: 'szolgaltatas/SZ3Utcakep.astro',
    name: 'Utcakép',
    idea: 'Széles illusztrált utcarészlet jelölőpontokkal (üzletportál, kisbusz, kirakat, rendezvénysátor); billentyűzettel és listaként is bejárható.',
    novelty: 'Felfedezhető kép a listák helyett.',
  },
  {
    id: 'SZ4', group: 'szolgaltatas', lane: 'tokenes', round: 3, status: 'tervezett', file: 'szolgaltatas/SZ4Targymutato.astro',
    name: 'Tárgymutató',
    idea: 'Ábécérendes mutató az összes szolgáltatásról, gépelés közbeni szűréssel.',
    novelty: 'Gyors út annak, aki pontosan tudja, mit keres.',
  },
  {
    id: 'SZ-K1', group: 'szolgaltatas', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'szolgaltatas/SZK1Kerdezzen.astro',
    name: 'Kérdezzen bátran',
    idea: 'Nagy kereső-jellegű mező („Mit szeretne? Pl. feliratot a kisbuszra”); gépelés közben beépített szólistából javasol szolgáltatást és következő lépést.',
    novelty: 'Beszélgetésszerű belépés, MI nélkül.',
    breaks: 'Új interakciós minta: óriás beviteli mező a navigáció helyett.',
    tokenProposals: ['óriás beviteli betűméret'],
  },
  // Folyamat
  {
    id: 'F1', group: 'folyamat', lane: 'tokenes', round: 3, status: 'tervezett', file: 'folyamat/F1OnEsMi.astro',
    name: 'Ön és mi',
    idea: 'Két párhuzamos sáv: lépésenként mit tesz a megrendelő és mit a műhely.',
    novelty: 'A közös munka átlátható, nem csak a műhely lépései látszanak.',
  },
  {
    id: 'F2', group: 'folyamat', lane: 'tokenes', round: 3, status: 'tervezett', file: 'folyamat/F2Vonalzo.astro',
    name: 'Vonalzó-idővonal',
    idea: 'A négy lépés egy hosszú méretvonalon, osztásokként; mobilon függőleges vonalzó.',
    novelty: 'A mérés nyelve viszi a folyamatot.',
  },
  {
    id: 'F3', group: 'folyamat', lane: 'tokenes', round: 3, status: 'tervezett', file: 'folyamat/F3MunkaUtja.astro',
    name: 'Egy munka útja',
    idea: 'Egy világító betűs cégér illusztrációja végigmegy a négy lépésen: felmérési vázlat → vektoros terv → gyártás → felszerelve.',
    novelty: 'Történet egy tárgyon keresztül, nem felsorolás.',
  },
  {
    id: 'F4', group: 'folyamat', lane: 'tokenes', round: 3, status: 'tervezett', file: 'folyamat/F4KetUtvonal.astro',
    name: 'Két útvonal',
    idea: 'A webshop-rendelés és az egyedi munka útja egymás mellett; kiemelve, hogy az ellenőrzésre küldés még nem jár fizetési kötelezettséggel.',
    novelty: 'A rendelés valódi menete a briefből, a bizalom fő kérdésére válaszol.',
  },
  {
    id: 'F-K1', group: 'folyamat', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'folyamat/FK1Munkalap.astro',
    name: 'Munkalap pecsétekkel',
    idea: 'A folyamat egy műhelyi munkalap; görgetéskor egyszer lecsapódnak a pecsétek: Felmérve, Jóváhagyva, Legyártva, Felszerelve.',
    novelty: 'Tárgyszerű, műhelyhangulatú megjelenés.',
    breaks: 'Új, pecsétszerű betű és papírtextúra; görgetésre induló mozgás.',
    tokenProposals: ['pecsét-betűtípus', 'papír-felület szín'],
  },
  // Referenciák
  {
    id: 'R1', group: 'referencia', lane: 'tokenes', round: 4, status: 'tervezett', file: 'referencia/R1Projektlap.astro',
    name: 'Projektlap',
    idea: 'Egyszerre egy munka egy teljes munkalapon: nagy kép, előtte/utána, méretvonal, anyagok, elvégzett lépések; lapozás és szűrés.',
    novelty: 'Mélység a mennyiség helyett.',
  },
  {
    id: 'R2', group: 'referencia', lane: 'tokenes', round: 4, status: 'tervezett', file: 'referencia/R2Terkep.astro',
    name: 'Térkép',
    idea: 'Stilizált Budapest/Magyarország-térkép a munkák helyszínével, felület szerinti szűréssel; mellette sima lista.',
    novelty: 'Megmutatja, hogy a műhely kiszáll és telepít.',
  },
  {
    id: 'R3', group: 'referencia', lane: 'tokenes', round: 4, status: 'tervezett', file: 'referencia/R3Leptekfal.astro',
    name: 'Léptékfal',
    idea: 'A munkák egymáshoz képest valós arányban a 180 cm-es sziluett mellett, a katalógus szabványos méreteivel, „példa” jelöléssel.',
    novelty: 'A műhely mérettartománya egy képen.',
  },
  {
    id: 'R4', group: 'referencia', lane: 'tokenes', round: 4, status: 'tervezett', file: 'referencia/R4Nagyito.astro',
    name: 'Nagyító',
    idea: 'Kör alakú lencse a csúszka helyett: ahol áll, ott az „utána” látszik; nyilakkal is mozgatható; világító munkáknál nappal/éjjel.',
    novelty: 'Játékosabb, pontosabb összehasonlítás, mint a csúszka.',
  },
  {
    id: 'R-K1', group: 'referencia', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'referencia/RK1Mintalegyezo.astro',
    name: 'Mintalegyező',
    idea: 'A referenciák egy színmintalegyező lapjai, szétnyitható és forgatható; billentyűzettel és listaként is.',
    novelty: 'Tárgyszerű böngészés a rács helyett.',
    breaks: 'Forgatós interakció és térhatás.',
    tokenProposals: ['legyezőlapok árnyéka'],
  },
  {
    id: 'R-K2', group: 'referencia', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'referencia/RK2EjszakaiSeta.astro',
    name: 'Éjszakai séta',
    idea: 'Éjszakai mód: a rács elsötétül, csak a világító munkák fénylenek, mintha este sétálna az utcán.',
    novelty: 'A cégér-üzletág kiemelése hangulattal.',
    breaks: 'Oldalszintű éjszakai mód: a teljes színvilág átvált.',
    tokenProposals: ['éjszakai háttér a --color-bg-nél sötétebben'],
  },
  // Grafikák
  {
    id: 'G1', group: 'grafika', lane: 'tokenes', round: 1, status: 'tervezett', file: 'grafika/G1Jelenetek.astro',
    name: 'Referencia-jelenetek',
    idea: 'A brief nyolc illusztrált helyőrzője egységes stílusban és léptékben, újrahasználható SVG-ként, nappal/éjjel nézettel.',
    novelty: 'Egy közös lépték és stílus a mostani eltérő jelenetek helyett; a színek tokenekből jönnek.',
  },
  {
    id: 'G2', group: 'grafika', lane: 'tokenes', round: 1, status: 'kesz', file: 'grafika/G2Piktogramok.astro',
    name: 'Piktogramcsalád',
    idea: 'Egy család a 4 szolgáltatáscsoporthoz, a 9 munkatípushoz és a 6 termékhez, 24 px-es rácson, három stílusban: vonalas, kitöltött, tervrajz.',
    novelty: 'Egy közös rendszer a két különálló piktogramkészlet helyett, mérési részletekkel.',
  },
  {
    id: 'G3', group: 'grafika', lane: 'tokenes', round: 1, status: 'kesz', file: 'grafika/G3Motivumok.astro',
    name: 'Mérés-motívumok',
    idea: 'Vonalzó, méretvonal, illesztőjel, vágójeles keret és vágóalátét-rács egy készletben, használati szabályokkal.',
    novelty: 'A márka legegyedibb eleme rendszerként, nem eseti díszként.',
  },
  {
    id: 'G4', group: 'grafika', lane: 'tokenes', round: 1, status: 'tervezett', file: 'grafika/G4Szomarka.astro',
    name: 'Szómárka-változatok',
    idea: 'A STILET DEKOR jel öt változata (vágott fólia, méretvonal, neoncső, illesztőjel, SD monogram) sötét és rózsaszín alapon, favicon-méretben is.',
    novelty: 'A mostani egyetlen szómárka helyett választható irányok a logóig.',
  },
  {
    id: 'G-K1', group: 'grafika', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'grafika/GK1Neoncso.astro',
    name: 'Neoncső-betűk',
    idea: 'Neoncső-hatású betűrendszer címekhez: cső, fény, rögzítőkapocs, kábel; a H-K1 is ezt használja.',
    novelty: 'Valódi neonreklám-hatás a sima ragyogás helyett.',
    breaks: 'Többrétegű fényeffektus, amelyet a tokenek nem írnak le.',
    tokenProposals: ['neoncső fénye', 'csőárnyék'],
  },
  {
    id: 'G-K2', group: 'grafika', lane: 'kiserleti', round: 5, status: 'tervezett', file: 'grafika/GK2Texturak.astro',
    name: 'Anyagtextúrák',
    idea: 'Gépi SVG/CSS-textúrák: szálcsiszolt alumínium, homokfúvott üveg, hálós molinó, perforált fólia.',
    novelty: 'Anyagszerű felületek az anyagfalhoz és az anyagkártyákhoz.',
    breaks: 'SVG-szűrős textúrák új felületszínekkel.',
    tokenProposals: ['alu, üveg és háló felületszínek'],
  },
];

/** The variants of one group and lane, in list order. */
export function variantsOf(group: VariantGroup, lane: VariantLane): Variant[] {
  return VARIANTS.filter((v) => v.group === group && v.lane === lane);
}
