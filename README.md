# Maneuver — Talk to Founder
A real-time voice AI that lets website visitors have a discovery 
call with Alex, founder of Maneuver. Built with LiveKit Agents.

---

## How to run locally

### Prerequisites
- Python 3.10–3.14
- uv (install: `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Node 18+ and pnpm (`npm install -g pnpm`)
- A LiveKit Cloud account (free tier works)

### 1. Clone and set up credentials

Create `.env.local` in `agent(python)/`:
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-key
LIVEKIT_API_SECRET=your-secret

Create `.env.local` in `frontend/`:
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-key
LIVEKIT_API_SECRET=your-secret
AGENT_NAME=my-agent

### 2. Start the agent
```bash
cd agent(python)/
uv sync
uv run python src/agent.py download-files
uv run python src/agent.py dev
```

### 3. Start the frontend
```bash
cd frontend/
pnpm install
pnpm dev
```

Open http://localhost:3000 and click Start conversation.

---

## Architecture
Browser (React/Next.js)
↕ WebRTC audio
LiveKit Cloud
↕ Job dispatch
Python Agent (LiveKit Agents 1.5)
→ STT: Deepgram Nova-3 (via LiveKit Inference)
→ LLM: GPT-4.1 (via LiveKit Inference)
→ TTS: Cartesia Sonic-3 (via LiveKit Inference)
→ VAD: Silero
→ Turn detection: MultilingualModel

---

## Models and why

**STT — Deepgram Nova-3**
Lowest latency STT available via LiveKit Inference. Multilingual 
support out of the box — tested in English and Hindi.

**LLM — GPT-4.1**
Strong instruction following for the founder persona. Reliable 
function/tool calling for RPC triggers and lead capture. 
Predictable latency for voice use cases.

**TTS — Cartesia Sonic-3**
~90ms time-to-first-byte. Sounds natural and conversational. 
Significantly lower latency than ElevenLabs for real-time voice.

**VAD — Silero + MultilingualModel turn detection**
Built into the LiveKit Agents pipeline. Handles natural pauses 
without cutting the user off mid-sentence.

---

## What the agent does

**Discovery mode (default)**
Alex opens the call, introduces himself, and runs a natural 
discovery conversation — one question at a time, following threads, 
not reciting a form. Captures: name, company, role, problem, 
current spend, timeline, budget, fit assessment.

**Q&A mode**
If the visitor asks about Maneuver (services, pricing, process, 
case studies), Alex answers from a structured knowledge base 
(maneuver_kb.md). Switches fluidly between modes mid-call.

**Synchronized visual layer**
LLM tool calls fire RPC events to the frontend over LiveKit's RPC 
protocol. The React frontend registers handlers and updates state 
immediately — visuals appear as the agent starts speaking, not after.

RPC methods:
- `founder.show_services_slide` → 2x2 service card grid
- `founder.show_service_detail` → zoomed single service view
- `founder.show_process_slide` → 6-step process list
- `founder.update_lead_panel` → live lead field population

**Lead capture**
Fields are captured silently during the call via `update_lead_field` 
tool calls. On disconnect, the full lead record is written to 
`agent(python)/leads.json`.

---

## What broke and how I fixed it

**Cartesia voice ID 404**
The starter template's default voice ID returned NOT_FOUND from 
LiveKit Inference. Fixed by switching to a valid Cartesia voice ID 
from the inference-supported voice list.

**session.wait_for_disconnect() missing**
`AgentSession` in livekit-agents 1.5.11 does not have this method. 
Fixed by using an `asyncio.Event` on the room `disconnected` event.

**RPC cleanup in React**
`registerRpcMethod` in livekit-client 2.17 returns void, not an 
unsubscribe function. Fixed by using `unregisterRpcMethod` in the 
useEffect cleanup.

**Two-column layout**
The `fixed inset-0` positioning on the session container conflicted 
with the flex layout. Fixed by ensuring the outer wrapper used 
`100vw`/`100vh` with proper flex children.

---

## What I'd build next with another week

1. **Multi-agent handoff** — discovery agent hands off to a 
   scheduling agent when the visitor is ready to book a call. 
   LiveKit Agents supports this natively via agent transfer.

2. **Slack notification on call end** — webhook fires when 
   leads.json is written, posts a summary to a founder Slack channel 
   with fit score and key captured fields.

3. **Admin dashboard** — simple Next.js route at /admin showing 
   all past leads, call duration, fit scores, with ability to 
   replay transcript.

4. **Smarter visual triggers** — currently visuals fire on explicit 
   tool calls. Next step: stream the LLM output and trigger 
   optimistic renders on keyword detection before the tool call 
   completes, reducing perceived latency to near zero.

5. **Avatar layer** — Anam avatar integration is already commented 
   out in the starter template. Would add a talking head video 
   alongside the audio visualizer for higher trust on the call.

---

## Captured lead output (demo calls)

**For reviewers:** sample captures from multiple test scenarios are in  
`agent(python)/leads-demo.json` (committed to the repo).

At runtime, each call appends to `agent(python)/leads.json` (gitignored).  
Scenarios in the demo file include D2C/high CAC, B2B SaaS, logistics,  
hospitality, partial disconnect, and full discovery with fit scores.
