# Setup

0. Install bun

```bash
curl -fsSL https://bun.sh/install | bash
```

1. Install dependencies

```bash
bun install
```

2. Configure environment variables in `.env`

```bash
OPENAI_API_KEY=your_openai_api_key
```

`OPENAI_API_KEY` is the only environment variable the app reads. It is used
server-side in `actions/getEphemeralToken.ts` to mint the short-lived client
token; it is never sent to the browser.

3. Start the app

```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000)
