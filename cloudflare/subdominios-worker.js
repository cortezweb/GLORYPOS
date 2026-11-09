// Worker de Cloudflare para los subdominios de cada empresa (cliente.glorypos.app).
// Cloudflare Pages no acepta dominios comodín (*.glorypos.app), así que este Worker
// recibe esas visitas y sirve la misma app desde Pages. La barra de direcciones sigue
// mostrando cliente.glorypos.app, y la app detecta la empresa por ese subdominio.
//
// Cómo usarlo (panel de Cloudflare):
//   1. Workers & Pages → Create → Worker → pega este código → Deploy.
//   2. En el Worker: Settings → Domains & Routes → Add route: *.glorypos.app/*  (zona glorypos.app)
//   3. DNS de glorypos.app: registro A  nombre "*"  valor 192.0.2.1  con Proxy (nube naranja) activado.
//   El dominio raíz (glorypos.app), www y api tienen sus propios registros y no pasan por aquí.

const ORIGEN_PAGES = 'glorypos.pages.dev';
const NO_TOCAR = ['www', 'api'];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const sub = url.hostname.split('.')[0];
    if (NO_TOCAR.includes(sub)) return fetch(request);

    url.hostname = ORIGEN_PAGES;
    const resp = await fetch(new Request(url.toString(), request));
    return new Response(resp.body, resp);
  },
};
