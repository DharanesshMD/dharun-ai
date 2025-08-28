'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  cn,
} from '@repo/ui';
import { ItemStatus, Step } from '@repo/shared/types';

type AgentThinkingProps = {
  stepsRecord?: Record<string, Step>;
  className?: string;
  title?: string;
  // Optional: control initial open state
  defaultOpen?: boolean;
  // Optional mocked steps override; when provided, these are used instead of stepsRecord
  mockedSteps?: Array<{ id: string; text: string; status?: ItemStatus }>; 
  // Animation interval in ms between revealing steps
  revealIntervalMs?: number;
  // Callbacks for integration
  onStepReveal?: (step: { id: string; text: string; status?: ItemStatus }, index: number) => void;
  onReachedStepId?: (stepId: string) => void;
  targetStepId?: string;
  onComplete?: () => void;
};

// Reasonable default mock steps if none are provided
const DEFAULT_MOCK_STEPS: Array<{ id: string; text: string; status?: ItemStatus }> = [
  { id: 's1', text: 'Parsing your request…', status: 'COMPLETED' },
  { id: 's2', text: 'Selecting tools and context…', status: 'COMPLETED' },
  { id: 's3', text: 'Gathering relevant knowledge…', status: 'COMPLETED' },
  { id: 's4', text: 'Synthesizing answer…', status: 'COMPLETED' },
  { id: 's5', text: 'Formatting final response…', status: 'COMPLETED' },
];

export function AgentThinking({
  stepsRecord,
  className,
  title = 'Agent thinking',
  defaultOpen = false,
  mockedSteps,
  revealIntervalMs = 550,
  onStepReveal,
  onReachedStepId,
  targetStepId,
  onComplete,
}: AgentThinkingProps) {
  const steps = useMemo(() => {
    // Prefer provided mockedSteps
    if (mockedSteps && mockedSteps.length) return mockedSteps;
    // Next, map real stepsRecord when available
    if (stepsRecord && Object.keys(stepsRecord).length > 0) {
      // Keep a stable order: by insertion/keys, falling back to id
      return Object.values(stepsRecord).map((s, idx) => ({
        id: s.id ?? `step-${idx}`,
        text: s.text ?? 'Working…',
        status: s.status,
      }));
    }
    // Finally, fallback to defaults
    return DEFAULT_MOCK_STEPS;
  }, [stepsRecord, mockedSteps]);

  const [open, setOpen] = useState(defaultOpen);
  const [revealedCount, setRevealedCount] = useState(defaultOpen ? steps.length : 0);

  useEffect(() => {
    if (!open) {
      setRevealedCount(0);
      return;
    }
    // Animate reveal one-by-one
    setRevealedCount(0);
    const timer = setInterval(() => {
      setRevealedCount(prev => {
        const next = prev + 1;
        return next >= steps.length ? steps.length : next;
      });
    }, revealIntervalMs);

    // Stop when fully revealed or panel is closed
    return () => clearInterval(timer);
  }, [open, steps.length, revealIntervalMs]);

  // Fire callbacks when steps reveal progresses
  useEffect(() => {
    if (!open) return;
    if (revealedCount === 0) return;
    const idx = revealedCount - 1;
    const step = steps[idx];
    if (!step) return;
    onStepReveal?.(step, idx);
    if (targetStepId && step.id === targetStepId) {
      onReachedStepId?.(step.id);
    }
    if (revealedCount === steps.length) {
      onComplete?.();
    }
  }, [revealedCount, open, steps, onStepReveal, targetStepId, onReachedStepId, onComplete]);

  return (
    <div className={cn('w-full max-w-[80%]', className)}>
      <Accordion
        type="single"
        collapsible
        value={open ? 'agent-thinking' : undefined}
        onValueChange={v => setOpen(Boolean(v))}
        className="rounded-lg border border-border bg-card/60 backdrop-blur"
      >
        <AccordionItem value="agent-thinking" className="px-0 py-0">
          <AccordionTrigger className="px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">
            {title}
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            <ol className="space-y-2">
              {steps.slice(0, revealedCount).map((s, idx) => (
                <li key={s.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-muted-foreground/70" />
                  <span className="text-foreground/90">{s.text}</span>
                </li>
              ))}
              {revealedCount < steps.length && (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex h-2.5 w-2.5 flex-none animate-pulse rounded-full bg-muted-foreground/50" />
                  Revealing steps…
                </li>
              )}
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
