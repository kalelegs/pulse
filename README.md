Pulse is a realtime assistant reference implementation built with Next.js, OpenAI Agents SDK, and modular JSON rendering.

## Features

- Low latency WebRTC connection to OpenAI for realtime agent execution
- Works with voice and text modalities (voice first)
- Modular and declarative realtime agents defined in [./agents](/agents/)
- Agents are capable of rendering UI dynamically using [json-render](https://github.com/vercel-labs/json-render)
  - Enable agents to render rich UI components natively
- Realtime events panel for debugging

## Setup

0. Install bun

````bash
curl -fsSL https://bun.sh/install | bash
```

1. Install dependencies

```bash
bun install
````

2. Configure environment variables in `.env`

```bash
OPENAI_API_KEY=your_openai_api_key
# todo: add remaining
```

3. Start the app

```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## References

- OpenAI Realtime voice agents guide: https://openai.github.io/openai-agents-js/guides/voice-agents/build/
- JSON Render: https://github.com/vercel-labs/json-render
- shadcn/ui components: https://ui.shadcn.com/docs/components
