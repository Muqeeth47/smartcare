'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DemoDB } from '@/lib/db/demo-db';
import type { TelemetryPacket15m, EpidemicForecastScenario, DistrictSupplyAggregate } from '@smartcare/types';

const SYNC_INTERVAL_SECONDS = 900; // 15 minutes = 900 seconds

export function useTelemetryLoop(autoStart = true) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(SYNC_INTERVAL_SECONDS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scen-baseline');
  const [lastPacket, setLastPacket] = useState<TelemetryPacket15m | null>(null);
  const [packets, setPackets] = useState<TelemetryPacket15m[]>([]);
  const scenarios = DemoDB.getForecastScenarios();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadPackets = useCallback(() => {
    const list = DemoDB.getTelemetryPackets();
    setPackets(list);
    if (list.length > 0) setLastPacket(list[0]);
  }, []);

  const triggerSync = useCallback(
    (scenarioId?: string): { packet: TelemetryPacket15m; updatedAggregate: DistrictSupplyAggregate } => {
      setIsSyncing(true);
      const chosenScenario = scenarioId || activeScenarioId;
      const res = DemoDB.trigger15mTelemetryCycle(chosenScenario);
      setLastPacket(res.packet);
      loadPackets();
      setSecondsRemaining(SYNC_INTERVAL_SECONDS);
      setTimeout(() => setIsSyncing(false), 400);
      return res;
    },
    [activeScenarioId, loadPackets]
  );

  // 1-second interval countdown for 15-minute sync loop
  useEffect(() => {
    loadPackets();

    if (!autoStart) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          triggerSync();
          return SYNC_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    const handleExternalSync = (e: Event) => {
      const packet = (e as CustomEvent).detail as TelemetryPacket15m;
      if (packet) {
        setLastPacket(packet);
        loadPackets();
        setSecondsRemaining(SYNC_INTERVAL_SECONDS);
      }
    };

    window.addEventListener('smartcare:telemetry-15m-sync', handleExternalSync);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('smartcare:telemetry-15m-sync', handleExternalSync);
    };
  }, [autoStart, triggerSync, loadPackets]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return {
    secondsRemaining,
    countdownFormatted: formatCountdown(secondsRemaining),
    isSyncing,
    activeScenarioId,
    setActiveScenarioId,
    scenarios,
    lastPacket,
    packets,
    triggerSync,
  };
}
