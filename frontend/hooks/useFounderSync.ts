'use client';

import { useEffect, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { markIntentionalAgentEnd } from '@/lib/intentional-agent-end';

export type FounderView =
  | { type: 'idle' }
  | { type: 'services_overview' }
  | { type: 'service_detail'; service: string }
  | { type: 'process' };

export interface LeadPanelState {
  name?: string;
  company?: string;
  role?: string;
  problem?: string;
  current_spend?: string;
  timeline?: string;
  budget?: string;
  fit_score?: string;
}

export function useFounderSync() {
  const room = useRoomContext();
  const [view, setView] = useState<FounderView>({ type: 'idle' });
  const [lead, setLead] = useState<LeadPanelState>({});

  useEffect(() => {
    if (!room) return;

    room.localParticipant.registerRpcMethod(
      'founder.show_services_slide',
      async (_data) => {
        setView({ type: 'services_overview' });
        return 'ok';
      }
    );

    room.localParticipant.registerRpcMethod(
      'founder.show_service_detail',
      async (data) => {
        try {
          const payload = JSON.parse(data.payload);
          setView({ type: 'service_detail', service: payload.service });
        } catch {
          setView({ type: 'services_overview' });
        }
        return 'ok';
      }
    );

    room.localParticipant.registerRpcMethod(
      'founder.show_process_slide',
      async (_data) => {
        setView({ type: 'process' });
        return 'ok';
      }
    );

    room.localParticipant.registerRpcMethod(
      'founder.update_lead_panel',
      async (data) => {
        try {
          const payload = JSON.parse(data.payload);
          setLead((prev) => ({ ...prev, [payload.field]: payload.value }));
        } catch {}
        return 'ok';
      }
    );

    room.localParticipant.registerRpcMethod(
      'founder.call_ending',
      async () => {
        markIntentionalAgentEnd();
        return 'ok';
      }
    );

    return () => {
      room.localParticipant.unregisterRpcMethod('founder.show_services_slide');
      room.localParticipant.unregisterRpcMethod('founder.show_service_detail');
      room.localParticipant.unregisterRpcMethod('founder.show_process_slide');
      room.localParticipant.unregisterRpcMethod('founder.update_lead_panel');
      room.localParticipant.unregisterRpcMethod('founder.call_ending');
    };
  }, [room]);

  return { view, lead };
}
