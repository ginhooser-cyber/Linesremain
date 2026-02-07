// ─── Loading Screen ───

import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';

// ─── Game Tips ───

const TIPS = [
  'Press Tab to open your inventory.',
  'Craft tools at a workbench to gather resources faster.',
  'Build a shelter before nightfall to stay safe.',
  'Watch your hunger and thirst bars — keep them full!',
  'Sprinting drains stamina faster.',
  'Stone tools are stronger than wooden ones.',
  'Press C to open the crafting menu.',
  'Press B to enter building mode.',
  'Press M to view the map.',
  'Use the scroll wheel to switch hotbar items.',
  'Monuments contain valuable loot — but they\'re dangerous!',
  'Team up with other players to survive longer.',
  'Always carry a light source when exploring caves.',
  'You can crouch with Ctrl to move quietly.',
];

// ─── Loading Stages ───

interface LoadingStage {
  label: string;
  threshold: number; // progress % at which this stage triggers
}

const STAGES: LoadingStage[] = [
  { label: 'Connecting to server...', threshold: 0 },
  { label: 'Loading terrain...', threshold: 20 },
  { label: 'Loading entities...', threshold: 70 },
  { label: 'Ready!', threshold: 90 },
];

function getStageLabel(progress: number): string {
  let label = STAGES[0]!.label;
  for (const stage of STAGES) {
    if (progress >= stage.threshold) {
      label = stage.label;
    }
  }
  return label;
}

// ─── Component ───

export const LoadingScreen: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tipIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);

  // Progress simulation
  useEffect(() => {
    doneRef.current = false;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 100;
        }
        const next = prev + Math.random() * 12 + 3;
        return Math.min(next, 100);
      });
    }, 200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Rotate tips every 3 seconds
  useEffect(() => {
    tipIntervalRef.current = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3000);

    return () => {
      if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current);
        tipIntervalRef.current = null;
      }
    };
  }, []);

  // Transition to game when done
  useEffect(() => {
    if (progress >= 100 && !doneRef.current) {
      doneRef.current = true;
      const timeout = setTimeout(() => {
        setScreen('playing');
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, setScreen]);

  const displayProgress = Math.min(Math.round(progress), 100);
  const stageLabel = getStageLabel(displayProgress);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <h1 style={styles.logo}>LINEREMAIN</h1>
          <div style={styles.logoSubtitle}>SURVIVAL</div>
        </div>

        {/* Stage label */}
        <p style={styles.stageLabel}>{stageLabel}</p>

        {/* Progress bar */}
        <div style={styles.barOuter}>
          <div
            style={{
              ...styles.barInner,
              width: `${displayProgress}%`,
            }}
          />
        </div>

        {/* Percentage */}
        <p style={styles.percentage}>{displayProgress}%</p>

        {/* Tip */}
        <div style={styles.tipContainer}>
          <span style={styles.tipLabel}>TIP: </span>
          <span style={styles.tipText}>{TIPS[tipIndex]}</span>
        </div>
      </div>
    </div>
  );
};

// ── Inline Styles ──

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    width: '450px',
    padding: '40px',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '24px',
  },
  logo: {
    fontSize: '48px',
    fontWeight: 900,
    color: '#e0e0e0',
    margin: 0,
    letterSpacing: '12px',
    textShadow: '0 0 30px rgba(100, 180, 255, 0.3), 0 2px 4px rgba(0,0,0,0.5)',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  logoSubtitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(100, 180, 255, 0.6)',
    letterSpacing: '8px',
    marginTop: '4px',
  },
  stageLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  barOuter: {
    width: '100%',
    height: '4px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  barInner: {
    height: '100%',
    background: 'linear-gradient(90deg, #4a90d9, #64b4ff)',
    borderRadius: '2px',
    transition: 'width 0.3s ease-out',
    boxShadow: '0 0 10px rgba(100, 180, 255, 0.4)',
  },
  percentage: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.35)',
    margin: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  tipContainer: {
    marginTop: '40px',
    textAlign: 'center',
    minHeight: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  tipLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'rgba(100, 180, 255, 0.5)',
    letterSpacing: '1px',
  },
  tipText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
};