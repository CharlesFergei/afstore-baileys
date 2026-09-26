# afstore-baileys

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20--24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/WhatsApp-Multi--Device-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
  <img src="https://img.shields.io/badge/AF%20STORE-Official%20Module-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-orange?style=for-the-badge" />
</p>

Custom WhatsApp WebSocket API Engine developed and maintained by **Farel (AF STORE)**. Built for high performance, stability, continuous marketing automation, auto session management, and clean mobile terminal operations.

---

## Key Enhancements & Features

1. **Proactive WebSocket Heartbeat & Silent-Drop Detection:**
   - Active ping-pong heartbeat at the socket layer to detect silent connection drops on VPS / Pterodactyl panels.
   - Forceful termination of dead connections ensuring clean, immediate auto-reconnection.

2. **Auto Phone Number Resolution (Anti-LID):**
   - Automatically prioritizes the real phone number (`@s.whatsapp.net`) over WhatsApp's internal `@lid` identifiers in group chats and private messages.

3. **Self-Contained Signal Protocol:**
   - Core cryptography and Signal Protocol bundled internally. 100% standalone with zero third-party Signal dependency.

4. **Built-in Session Garbage Collector:**
   - Automatically prunes expired pre-key files in `useMultiFileAuthState` to prevent disk inode exhaustion on hosting panels, while keeping authentication credentials (`creds.json`) 100% safe.

5. **Console Noise Suppression:**
   - Intelligently silences routine decryption noise (Bad MAC, session counter mismatches) preventing console spam and keeping strict mobile 42-column terminals pristine.

6. **Universal Node.js 20 - 24 Compatibility:**
   - Fully optimized and tested for Node.js 20, 21, 22, 23, and 24.
   - Native dual compatibility for `Uint8Array` & `Buffer`, universal WebCrypto fallback, and strict ESM/CJS exports mapping.

---

## Installation

Install directly from GitHub:

```bash
npm install github:CharlesFergei/afstore-baileys
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "baileys": "github:CharlesFergei/afstore-baileys"
  }
}
```

---

## Basic Usage

```javascript
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from 'baileys';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('AF STORE Bot Connected successfully!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    console.log(`Received message from: ${m.key.participant || m.key.remoteJid}`);
  });
}

startBot();
```

---

## Developer & Official Contact

- **Developer & Owner:** **Farel** (Founder AF STORE)
- **Official WhatsApp:** [wa.me/6285879220690](https://wa.me/6285879220690)
- **Official Telegram:** [t.me/Vnzxok](https://t.me/Vnzxok)
- **Official Channel:** [AF STORE WhatsApp Channel](https://whatsapp.com/channel/0029Vb7hrR7Fi8xX9Ch6Q73m)

---

## License

This project is licensed under the [MIT License](LICENSE).
