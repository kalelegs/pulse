# Setup

0. Install bun

```bash
curl -fsSL https://bun.sh/install | bash
```

1. Install dependencies

```bash
bun install
```

2. Configure environment variables in `.env` (copy `.env.example` to start)

```bash
OPENAI_API_KEY=your_openai_api_key
FINNHUB_API_KEY=your_finnhub_api_key   # optional
```

`OPENAI_API_KEY` is required. It is used server-side in
`actions/getEphemeralToken.ts` to mint the short-lived client token; it is
never sent to the browser.

`FINNHUB_API_KEY` is optional. The stock analyst gets prices, day and 52-week
ranges, volume and price history from Yahoo Finance without any key. A Finnhub
key (free tier at [finnhub.io](https://finnhub.io)) additionally unlocks market
cap, P/E, EPS, dividend yield, beta, analyst buy/hold/sell counts and the past
week's news headlines. Without it those figures are omitted from the cards, the
spoken summary says they are unavailable, and `get_stock_news` tells the model
that news needs an API key. Like the OpenAI key it is read only on the server,
in `actions/getStockReports.ts`.

3. Start the app

```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000)
