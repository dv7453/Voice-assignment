import asyncio
import json
import logging
import textwrap
from pathlib import Path
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    AgentStateChangedEvent,
    JobContext,
    JobProcess,
    RunContext,
    UserInputTranscribedEvent,
    cli,
    function_tool,
    get_job_context,
    inference,
    room_io,
)
from livekit.plugins import silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")
load_dotenv(".env.local")

KB_PATH = Path(__file__).parent.parent / "maneuver_kb.md"
LEADS_PATH = Path(__file__).parent.parent / "leads.json"


def load_kb() -> str:
    if KB_PATH.exists():
        return KB_PATH.read_text()
    return ""


MANEUVER_KB = load_kb()

SILENCE_NUDGE = "Take your time, I am still here whenever you are ready."

SYSTEM_PROMPT = textwrap.dedent(f"""\
You are Alex, founder of Maneuver — a performance marketing agency.
You are on a live discovery call with someone who just landed on the Maneuver website.

Your job has two parts:
1. Run a discovery call — understand who they are and whether Maneuver can help them.
2. Answer questions about Maneuver accurately using your knowledge base.

# Your personality
- You are direct, curious, and confident — not salesy.
- You have opinions. If their timeline seems unrealistic, say so.
- You ask one question at a time and actually listen to the answer.
- You echo back what you heard before moving forward.
- You do not pitch Maneuver until you understand the person's situation.

# Discovery flow (default mode)
Open with a warm intro, then walk through these areas — but make it feel 
like a real conversation, not a form:
1. Who they are and what their company does
2. What problem they are trying to solve right now
3. Current marketing situation (what they have tried, what is working)
4. Scale — revenue, ad spend, team size
5. Timeline and urgency
6. Budget range

Do not ask all of these at once. Ask one, listen, follow threads that seem 
interesting, then continue. After 4-5 exchanges, if there is a clear fit, 
it is natural to say "this actually sounds like a strong match for one of 
our services."

# Conversational flow
- When the user says goodbye, thanks bye, or any clear farewell: first say a 
  warm closing line out loud such as "It was great speaking with you, I'll be 
  in touch soon." THEN call the end_call tool. Always speak before calling 
  the tool, never at the same time.
- If the user is silent after you ask a question, the system will automatically 
  say "Take your time, I am still here whenever you are ready." Do not repeat 
  that phrase yourself. After it plays, stay silent and wait. Do not ask your 
  question again until the user speaks.

# Q&A mode
If the visitor asks about Maneuver — services, pricing, process, case 
studies, team — answer from the knowledge base below. Be conversational, 
not robotic. Do not recite everything at once. Give the relevant part and 
offer to go deeper.

# Voice output rules
- Plain text only. No markdown, no lists, no bullet points.
- Keep replies to 2-4 sentences unless the person asked for detail.
- Ask one question at a time.
- Spell out numbers and currency values naturally.
- Do not say "Great question" or "Absolutely" — just answer.

# Lead capture
As the person shares information, use the update_lead_field tool to 
capture it silently. Do not tell the user you are saving data. Capture:
- name
- company
- role
- problem
- current_spend
- timeline
- budget
- fit_score (your assessment: hot / warm / cold)

At the end of the call or when the conversation reaches a natural close, 
call save_lead to persist everything.

# Knowledge base
{MANEUVER_KB}
""")


class Assistant(Agent):
    def __init__(self) -> None:
        self._lead: dict = {}
        super().__init__(
            llm=inference.LLM(model="openai/gpt-4.1"),
            instructions=SYSTEM_PROMPT,
        )

    def _get_user_identity(self, context: RunContext) -> str:
        room = get_job_context().room
        for participant in room.remote_participants.values():
            print(f"[RPC] Found participant identity: {participant.identity}")
            return participant.identity
        print("[RPC] No remote participants found!")
        return ""

    @function_tool
    async def update_lead_field(
        self, context: RunContext, field: str, value: str
    ) -> str:
        """
        Silently capture a piece of information about the lead as the
        conversation progresses. Call this whenever the user reveals
        something relevant.

        Args:
            field: one of: name, company, role, problem, current_spend,
                   timeline, budget, fit_score
            value: the value to store
        """
        import json as _json

        self._lead[field] = value
        logger.info(f"Lead field updated: {field} = {value}")
        try:
            await get_job_context().room.local_participant.perform_rpc(
                destination_identity=self._get_user_identity(context),
                method="founder.update_lead_panel",
                payload=_json.dumps({"field": field, "value": value}),
            )
        except Exception as e:
            logger.warning(f"RPC failed (lead panel): {e}")
        return "captured"

    @function_tool
    async def save_lead(self, context: RunContext) -> str:
        """
        Save the full lead record to disk. Call this when the conversation
        is wrapping up or the user says goodbye.
        """
        leads = []
        if LEADS_PATH.exists():
            try:
                leads = json.loads(LEADS_PATH.read_text())
            except Exception:
                leads = []
        leads.append(self._lead)
        LEADS_PATH.write_text(json.dumps(leads, indent=2))
        logger.info(f"Lead saved: {self._lead}")
        return "saved"

    @function_tool
    async def end_call(self, context: RunContext) -> str:
        """
        End the call. Call this ONLY after you have already
        spoken a warm closing line out loud — something like
        "It was great speaking with you, I'll be in touch soon."
        Do NOT call this tool at the same time as speaking.
        Speak first, then call this tool.
        The call will disconnect 4 seconds after this tool runs.
        """
        async def _disconnect():
            try:
                identity = self._get_user_identity(context)
                await get_job_context().room.local_participant.perform_rpc(
                    destination_identity=identity,
                    method="founder.call_ending",
                    payload="{}",
                )
            except Exception as e:
                logger.warning(f"RPC call_ending failed: {e}")
            await asyncio.sleep(4)
            ctx = get_job_context()
            await ctx.room.disconnect()

        asyncio.ensure_future(_disconnect())
        logger.info("end_call tool invoked, disconnect scheduled in 4s")
        return "ending call in 4 seconds"

    @function_tool
    async def show_services_slide(self, context: RunContext) -> str:
        """
        Show the services overview slide on the visitor's screen.
        Call this when the user asks what Maneuver does, what services
        are offered, or how Maneuver can help. Fire this as soon as
        you start answering — do not wait until you finish speaking.
        """
        try:
            identity = self._get_user_identity(context)
            print(f"[RPC] Attempting show_services_slide to identity: {identity}")
            await get_job_context().room.local_participant.perform_rpc(
                destination_identity=identity,
                method="founder.show_services_slide",
                payload="{}",
            )
            logger.info("RPC sent: founder.show_services_slide")
        except Exception as e:
            logger.warning(f"RPC failed: {e}")
        return "slide shown"

    @function_tool
    async def show_service_detail(
        self, context: RunContext, service_name: str
    ) -> str:
        """
        Zoom into a specific Maneuver service on the visitor's screen.
        Call this when the user asks about a specific service by name.
        service_name must be one of: paid_media, growth_sprint,
        creative_studio, full_stack_retainer

        Args:
            service_name: the slug of the service to highlight
        """
        import json as _json

        try:
            await get_job_context().room.local_participant.perform_rpc(
                destination_identity=self._get_user_identity(context),
                method="founder.show_service_detail",
                payload=_json.dumps({"service": service_name}),
            )
            logger.info(f"RPC sent: founder.show_service_detail({service_name})")
        except Exception as e:
            logger.warning(f"RPC failed: {e}")
        return f"detail shown for {service_name}"

    @function_tool
    async def show_process_slide(self, context: RunContext) -> str:
        """
        Show Maneuver's engagement process on the visitor's screen.
        Call this when the user asks how Maneuver works, what the
        process is, or what happens after they sign up.
        """
        try:
            await get_job_context().room.local_participant.perform_rpc(
                destination_identity=self._get_user_identity(context),
                method="founder.show_process_slide",
                payload="{}",
            )
            logger.info("RPC sent: founder.show_process_slide")
        except Exception as e:
            logger.warning(f"RPC failed: {e}")
        return "process slide shown"


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    session = AgentSession(
        stt=inference.STT(
            model="deepgram/nova-3",
            language="multi",
        ),
        tts=inference.TTS(
            model="cartesia/sonic-3",
            voice="694f9389-aac1-45b6-b726-9d9369183238"
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
        min_endpointing_delay=0.2,
        max_endpointing_delay=0.6,
    )

    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_options=room_io.RoomOptions(),
    )

    await ctx.connect()

    await session.generate_reply(
        instructions=(
            "Open with a brief warm intro as Alex, founder of Maneuver. "
            "Ask who they are and what brings them here. One question only."
        ),
    )

    disconnect_event = asyncio.Event()

    async def _silence_monitor():
        GRACE = 6.0          # seconds after agent stops before timer starts
        NUDGE1_WAIT = 15.0   # silence seconds before first nudge
        NUDGE2_WAIT = 20.0   # more silence before second nudge
        NUDGE1 = "Take your time, I am still here whenever you are ready."
        NUDGE2 = "I will go ahead and pause here. Feel free to come back whenever you are ready."

        loop = asyncio.get_event_loop()
        # Wall-clock time before which we never nudge
        earliest_nudge_allowed = loop.time() + 999
        user_spoke_at = loop.time()
        nudge1_done = False
        nudge2_done = False
        agent_speaking = False
        nudge_speaking = False
        nudge1_fired_at = 0.0

        def _on_state(ev):
            nonlocal earliest_nudge_allowed, agent_speaking, nudge1_done, nudge2_done, nudge_speaking
            state_str = str(getattr(ev, "state", getattr(ev, "new_state", "")))
            if "speaking" in state_str:
                agent_speaking = True
                earliest_nudge_allowed = loop.time() + 999
                # Only reset nudge flags if this is the real agent speaking
                # NOT when the nudge itself is playing
                if not nudge_speaking:
                    nudge1_done = False
                    nudge2_done = False
            elif "listening" in state_str and agent_speaking:
                agent_speaking = False
                if not nudge_speaking:
                    earliest_nudge_allowed = loop.time() + GRACE

        def _on_user_speech(*args, **kwargs):
            nonlocal user_spoke_at, nudge1_done, nudge2_done, earliest_nudge_allowed
            ev = args[0] if args else None
            if (
                ev is not None
                and hasattr(ev, "is_final")
                and hasattr(ev, "transcript")
                and (not ev.is_final or not (ev.transcript or "").strip())
            ):
                return
            user_spoke_at = loop.time()
            nudge1_done = False
            nudge2_done = False
            # Block nudges again until agent responds and finishes
            earliest_nudge_allowed = loop.time() + 999

        session.on("agent_state_changed", _on_state)
        session.on("user_input_transcribed", _on_user_speech)

        try:
            while not disconnect_event.is_set():
                await asyncio.sleep(3)
                now = loop.time()

                # Not yet in the nudge window
                if now < earliest_nudge_allowed:
                    continue

                silence = now - max(user_spoke_at, earliest_nudge_allowed - GRACE)

                if not nudge1_done and silence >= NUDGE1_WAIT:
                    nudge1_done = True
                    logger.info("Silence nudge 1 triggered")
                    try:
                        nudge_speaking = True
                        handle = session.say(NUDGE1, allow_interruptions=True)
                        await handle.wait_for_playout()
                        nudge_speaking = False
                    except Exception as e:
                        nudge_speaking = False
                        logger.warning(f"Nudge 1 failed: {e}")
                    # Set the window AFTER nudge finishes playing
                    # so _on_state speaking/listening cannot overwrite it
                    nudge1_fired_at = loop.time()
                    earliest_nudge_allowed = nudge1_fired_at + NUDGE2_WAIT

                elif nudge1_done and not nudge2_done and now >= earliest_nudge_allowed:
                    nudge2_done = True
                    earliest_nudge_allowed = loop.time() + 999
                    logger.info("Silence nudge 2 triggered")
                    try:
                        nudge_speaking = True
                        handle = session.say(NUDGE2, allow_interruptions=True)
                        await handle.wait_for_playout()
                        nudge_speaking = False
                    except Exception as e:
                        nudge_speaking = False
                        logger.warning(f"Nudge 2 failed: {e}")
        except asyncio.CancelledError:
            pass

    silence_task = asyncio.ensure_future(_silence_monitor())

    @ctx.room.on("disconnected")
    def _on_room_disconnected(_reason) -> None:
        disconnect_event.set()

    try:
        await disconnect_event.wait()
    finally:
        silence_task.cancel()
        if session.current_agent and hasattr(session.current_agent, '_lead'):
            lead = session.current_agent._lead
            if lead:
                leads = []
                if LEADS_PATH.exists():
                    try:
                        leads = json.loads(LEADS_PATH.read_text())
                    except Exception:
                        leads = []
                leads.append(lead)
                LEADS_PATH.write_text(json.dumps(leads, indent=2))
                logger.info(f"Lead auto-saved on disconnect: {lead}")


if __name__ == "__main__":
    cli.run_app(server)
