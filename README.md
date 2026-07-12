# minecraft-npc-24-7

Bot que se conecta a un servidor de Minecraft **como un jugador real**, 24/7,
usando [mineflayer](https://github.com/PrismarineJS/mineflayer). No instala
nada en el servidor: no es un plugin ni un mod, es un script Node.js externo
que se conecta por la red igual que lo haría un cliente normal.

Al ser una conexión real, el bot:
- Ocupa un slot real de jugador.
- Aparece en la tablist y en `/list`.
- Cuenta como jugador conectado para cualquier host o monitor que vigile
  conexiones reales (a diferencia de un plugin que solo falsea el ping).

## Requisitos

- El servidor debe estar en **offline-mode / cracked** (`online-mode=false`
  en `server.properties`), porque el bot se conecta solo con un username, sin
  autenticar contra una cuenta Microsoft real.
- [Node.js](https://nodejs.org/) 18 o superior instalado donde vayas a correr
  el bot (no en el servidor de Minecraft).

## Instalación

```bash
git clone git@github.com:zyren-vtuber/minecraft-npc-24-7.git
cd minecraft-npc-24-7
npm install
cp .env.example .env
```

Edita `.env` con los datos de tu servidor:

```env
MC_HOST=tu-servidor.example.com
MC_PORT=25565
MC_USERNAME=NPC_Bot
MC_VERSION=
ANTI_AFK_INTERVAL_MS=30000
RECONNECT_DELAY_MS=10000
RECONNECT_MAX_DELAY_MS=300000
PANEL_ENABLED=true
PANEL_PORT=3000
```

- `MC_VERSION` puede dejarse vacío para que mineflayer detecte la versión del
  servidor automáticamente.
- `ANTI_AFK_INTERVAL_MS` controla cada cuánto el bot mira alrededor, salta y
  da un par de pasos, para no quedarse inmóvil (evita kicks por AFK y se ve
  más natural).
- `RECONNECT_DELAY_MS` / `RECONNECT_MAX_DELAY_MS` controlan el backoff de
  reconexión si el bot se cae o lo desconectan.

## Uso

```bash
npm start
```

Esto deja el bot corriendo en primer plano, con reconexión automática si se
cae la conexión. Para que quede corriendo 24/7 de verdad, usa un gestor de
procesos, por ejemplo [pm2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start src/index.js --name npc247
pm2 save
```

## Panel en tiempo real

Con `PANEL_ENABLED=true` (por defecto) el bot levanta una página web local en
`http://localhost:3000` (o el puerto que pongas en `PANEL_PORT`) que muestra
en vivo quién está conectado al servidor — usa la propia visión del bot como
jugador real (`bot.players`), así que es exacto y se actualiza al instante
cuando alguien entra o sale, sin refrescar la página.

No tiene autenticación (cualquiera con el link ve nombres y ping de quien está
conectado — nada sensible, pero ten esto en cuenta).

### Verlo desde https://zyren-vtuber.github.io/minecraft-npc-24-7/

GitHub Pages solo sirve archivos estáticos, no puede correr el servidor
Node.js ni el WebSocket. Para verlo desde ahí, el bot expone tu panel local a
internet con un [Cloudflare Tunnel](https://github.com/cloudflare/cloudflared)
gratuito, y la página estática se conecta a esa URL:

1. Una sola vez: `npm run setup:tunnel` (descarga `cloudflared` a `bin/`, no
   se sube al repo).
2. En tu `.env`: `TUNNEL_ENABLED=true`.
3. `npm start`. En la consola va a aparecer algo como:
   ```
   Panel publico: https://algo-random.trycloudflare.com
   Abre esto para ver el panel: https://zyren-vtuber.github.io/minecraft-npc-24-7/?ws=wss://algo-random.trycloudflare.com
   ```
   Abre ese segundo link. La página guarda esa URL en el navegador, así que
   las próximas veces basta con abrir `https://zyren-vtuber.github.io/minecraft-npc-24-7/`
   directo — y si el túnel cambia de URL (pasa en cada reinicio, porque es la
   versión gratuita sin dominio propio), pega la nueva en el campo de arriba
   del panel y dale "Guardar".

El túnel (y por lo tanto el panel público) solo vive mientras `npm start`
esté corriendo en algún lado. Si quieres que esto funcione de verdad 24/7 sin
depender de que tu PC esté prendida, el bot necesita correr en una máquina
que sí esté siempre encendida (un VPS, por ejemplo) — ahí es donde correrías
`npm start` con `TUNNEL_ENABLED=true`.

## Qué NO hace

- No evade baneos ni sistemas anti-bot/anti-cheat del servidor: si el
  servidor detecta y banea bots, este seguirá siendo detectable como
  cualquier bot simple (no imita comportamiento humano complejo, solo
  movimiento básico anti-AFK).
- No funciona contra servidores en online-mode sin credenciales reales de una
  cuenta Microsoft — eso está fuera del alcance de este proyecto.
- No garantiza que un hosting gratuito no apague la máquina completa por
  otras razones (uso de CPU/RAM, límites de horas, etc.), solo mantiene una
  conexión de jugador real activa.

## Estructura

```
src/
  index.js          # entrada: conecta y gestiona reconexión con backoff
  config.js          # lee .env
  logger.js          # logs con timestamp
  bot/
    createBot.js      # crea el bot de mineflayer y sus listeners
    antiAfk.js         # movimiento periódico para evitar AFK-kick
  panel/
    panelServer.js     # servidor HTTP + WebSocket del panel
    public/index.html   # pagina del panel
```

## Licencia

MIT — ver [LICENSE](LICENSE).
