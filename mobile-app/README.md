# Viwanda Prime Mobile

A standalone mobile web/PWA edition of Viwanda Prime. It preserves the live app's design and workflows, but always uses the compact phone shell and runs independently on port **3001**. The original web project is not modified or required at runtime.

## Run on this computer

```bash
cd mobile-app
npm install
npx prisma db push
npm run dev
```

Open `http://localhost:3001`.

## Open it from another phone or computer

Both `dev` and `start` bind to `0.0.0.0`. Find the server computer's LAN IPv4 address:

```powershell
ipconfig
```

Then open this on the other device while both are on the same network:

```text
http://SERVER_IP:3001
```

Example: `http://192.168.1.25:3001`.

If it does not connect, allow Node.js or TCP port 3001 through Windows Firewall:

```powershell
New-NetFirewallRule -DisplayName "Viwanda Mobile 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

## Production

```bash
npm install
npx prisma db push
npm run build
npm start
```

To use another port after building:

```bash
npm run start:port -- -p 4001
```

Copy `.env.example` to `.env` and replace `AUTH_SECRET` before deployment. The included SQLite database contains demo data; run `npm run db:reset` to recreate it.

## Install on a phone

The app includes a manifest, mobile icon, standalone display metadata, and a safe service worker. Home-screen installation requires HTTPS on non-localhost deployments. In Chrome use **Install app**; on iOS Safari use **Share → Add to Home Screen**.
