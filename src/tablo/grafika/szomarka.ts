// The wordmark directions of G4: the typographic sign "STILET DEKOR" until the logo exists.

export type SzomarkaValtozat = 'vagott' | 'meretvonal' | 'neon' | 'illesztojel' | 'monogram';

export const SZOMARKAK: readonly { readonly id: SzomarkaValtozat; readonly nev: string; readonly leiras: string }[] = [
  { id: 'vagott', nev: 'Vágott fólia', leiras: 'A betűk közepén vágásvonal, az alsó fél kissé elcsúszva, mint a plotteren vágott, lehúzott fólia.' },
  { id: 'meretvonal', nev: 'Méretvonallal', leiras: 'A jel fölött méretvonal M 1:1 jelöléssel: a pontos mérés ígérete.' },
  { id: 'neon', nev: 'Neoncső', leiras: 'Körvonalas betűk fénnyel, a világító reklám világa; rózsaszín alapon fény nélkül.' },
  { id: 'illesztojel', nev: 'Illesztőjellel', leiras: 'Kondenzált STILET, nyomdai illesztőjel, ritkított, írógépes DEKOR.' },
  { id: 'monogram', nev: 'SD monogram', leiras: 'Négyzetes SD jel vágójelekkel, faviconnak és kis helyekre.' },
];
