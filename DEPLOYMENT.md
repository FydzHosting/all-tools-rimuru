# Fydz Tools — Web Deployment

## Local
```bash
npm install
npm start
```

## Deploy to Render/Railway/VPS
- Build/install command: `npm install`
- Start command: `npm start`
- Add the environment variables required by the API adapters in `.env`.
- The server must listen on the platform-provided `PORT`.

## Important
Some downloader/AI adapters depend on third-party endpoints. If an endpoint changes, that individual tool may stop working and needs its adapter updated.


### Important
Deploy the entire project, including `api/[...path].js`, `server.js`, `package.json`, `index.html`, `app.js`, `styles.css`, and assets. Do not deploy only the static HTML if you want AI/download APIs to work.
