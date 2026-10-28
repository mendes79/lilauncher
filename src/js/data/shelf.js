/* shelf.js — fileira fixa do launcher (ordem e capas hero definidas por Luís).
 * id = id real do app na TV (usado no launch). hero = imagem em src/img/logos/.
 * Itens com "(validar)" têm id a confirmar no on-device. */
window.SHELF = [
  { id: 'gz3rVzUIC7.IBOPlayer',        name: 'IBOPlayer',       hero: 'img/logos/iboplayer.jpg' },
  { id: 'org.tizen.netflix-app',       name: 'Netflix',         hero: 'img/logos/netflix.jpg' },
  { id: 'com.samsung.tv.aria-video',   name: 'Apple TV',        hero: 'img/logos/appletv.jpg' },
  { id: 'org.tizen.primevideo',        name: 'Prime Video',     hero: 'img/logos/primevideo.jpg' },
  { id: 'X1pKpFCiUu.PlutoTV',          name: 'Pluto TV',        hero: 'img/logos/plutotv.jpg' },
  { id: 'org.tizen.globoplayapp',      name: 'Globoplay',       hero: 'img/logos/globoplay.jpg' },
  { id: 'cexr1qp97S.Deezer',           name: 'Deezer',          hero: 'img/logos/deezer.jpg' },
  { id: '9Ur5IzDKqV.TizenYouTube',     name: 'YouTube',         hero: 'img/logos/youtube.jpg' },
  { id: 'cj37Ni3qXM.HBONow',           name: 'HBO Max',         hero: 'img/logos/hbomax.jpg' },
  { id: 'pZAXcloxTr.Sbt',              name: '+SBT',            hero: 'img/logos/sbt.jpg' },
  // Adicionados (ids reais confirmados via vd_applist). TV Plus removido: não é lançável.
  { id: 'MCmYXNxgcu.DisneyPlus',       name: 'Disney+',         hero: 'img/logos/disney.jpg' },
  { id: 'PHq4K3rTG8.ALCHRETAIL',       name: 'Star+',           hero: 'img/logos/starplus.jpg' },
  { id: 'rJeHak5zRg.Spotify',          name: 'Spotify',         hero: 'img/logos/spotify.jpg' },
  { id: 'org.tizen.browser',           name: 'Navegador',       hero: 'img/logos/navegador.jpg' }
];
window.SPECIALS = {
  entradas: { name: 'Entradas',        hero: 'img/logos/entradas.jpg' },
  todos:    { name: 'Todos os apps',   hero: 'img/logos/todos.jpg' },
  config:   { name: 'Configurações',   hero: 'img/logos/config.jpg' }
};
