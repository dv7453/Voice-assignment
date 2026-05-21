import { ReactNode, useEffect, useRef } from 'react';
import { DisconnectReason, RoomEvent } from 'livekit-client';
import { toast as sonnerToast } from 'sonner';
import { useAgent, useSessionContext } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { consumeIntentionalAgentEnd } from '@/lib/intentional-agent-end';

interface ToastProps {
  title: ReactNode;
  description: ReactNode;
}

function toastAlert(toast: ToastProps) {
  const { title, description } = toast;

  return sonnerToast.custom(
    (id) => (
      <Alert onClick={() => sonnerToast.dismiss(id)} className="bg-accent w-full md:w-[364px]">
        <WarningIcon weight="bold" />
        <AlertTitle>{title}</AlertTitle>
        {description && <AlertDescription>{description}</AlertDescription>}
      </Alert>
    ),
    { duration: 10_000 }
  );
}

const AGENT_LEFT_MESSAGE = 'Agent left the room unexpectedly.';

const CLEAN_DISCONNECT_REASONS = new Set<DisconnectReason>([
  DisconnectReason.CLIENT_INITIATED,
  DisconnectReason.USER_REJECTED,
  DisconnectReason.PARTICIPANT_REMOVED,
  DisconnectReason.ROOM_DELETED,
  DisconnectReason.SERVER_SHUTDOWN,
]);

function isCleanDisconnect(reason?: DisconnectReason): boolean {
  if (reason === undefined) {
    return true;
  }
  return CLEAN_DISCONNECT_REASONS.has(reason);
}

export function useAgentErrors() {
  const agent = useAgent();
  const { isConnected, end, room } = useSessionContext();
  const cleanDisconnectRef = useRef(false);

  useEffect(() => {
    const onDisconnected = (reason?: DisconnectReason) => {
      cleanDisconnectRef.current = isCleanDisconnect(reason);
    };

    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room]);

  useEffect(() => {
    if (isConnected && agent.state === 'failed') {
      const reasons = agent.failureReasons ?? [];

      const onlyAgentLeft =
        reasons.length === 1 && reasons[0] === AGENT_LEFT_MESSAGE;

      if (
        consumeIntentionalAgentEnd() ||
        onlyAgentLeft ||
        cleanDisconnectRef.current
      ) {
        end();
        return;
      }

      toastAlert({
        title: 'Session ended',
        description: (
          <>
            {reasons.length > 1 && (
              <ul className="list-inside list-disc">
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
            {reasons.length === 1 && <p className="w-full">{reasons[0]}</p>}
            <p className="w-full">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://docs.livekit.io/agents/start/voice-ai/"
                className="whitespace-nowrap underline"
              >
                See quickstart guide
              </a>
              .
            </p>
          </>
        ),
      });

      end();
    }
  }, [agent, isConnected, end]);
}
