import { Colors } from '@/constants/Colors';
import { showToast, dismissToast } from 'react-native-nitro-toast';
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

// ── Types ──────────────────────────────────────────────────────────────────

type ToastVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger';

export interface ToastShowConfig {
  id?: string;
  variant?: ToastVariant;
  label?: string;
  description?: string;
  /** Not supported with native toasts — silently ignored */
  actionLabel?: string;
  /** Not supported with native toasts — silently ignored */
  onActionPress?: (args: {
    hide: () => void;
    show: (opts: string | ToastShowConfig) => string;
  }) => void;
  duration?: number | 'persistent';
}

interface ToastContextValue {
  toast: {
    show: (options: string | ToastShowConfig) => string;
    hide: (ids?: string | string[] | 'all') => void;
  };
  isToastVisible: boolean;
}

// ── Module-level ID tracking for hide() support ────────────────────────────

const activeIds: string[] = [];

// ── Context ────────────────────────────────────────────────────────────────

const ToastCtx = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return { toast: ctx.toast, isToastVisible: ctx.isToastVisible };
}

// ── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const ctx = useMemo<ToastContextValue>(() => {
    const show = (options: string | ToastShowConfig): string => {
      const config: ToastShowConfig = typeof options === 'string' ? { label: options } : options;

      const variantTypeMap: Record<ToastVariant, string> = {
        success: 'success',
        warning: 'warning',
        danger: 'error',
        accent: 'info',
        default: 'default',
      };

      const type = variantTypeMap[config.variant ?? 'default'] as
        | 'success'
        | 'error'
        | 'warning'
        | 'info'
        | 'default';

      // When there's a description, use label as title and description as message
      const message = config.description ?? config.label ?? '';
      const title = config.description ? config.label : undefined;

      const rawDuration = config.duration;
      const duration =
        rawDuration === 'persistent' ? 0 : typeof rawDuration === 'number' ? rawDuration : 4000;

      const id = showToast(message, {
        toastId: config.id,
        type,
        presentation: 'stacked',
        duration,
        title,
        position: 'top',
        useOverlay: false,
        haptics: false,
      });

      activeIds.push(id);
      if (duration > 0) {
        setTimeout(() => {
          const idx = activeIds.indexOf(id);
          if (idx !== -1) activeIds.splice(idx, 1);
        }, duration + 500);
      }

      return id;
    };

    const hide = (ids?: string | string[] | 'all') => {
      if (ids === 'all') {
        [...activeIds].forEach((id) => dismissToast(id));
        activeIds.length = 0;
        return;
      }

      const idsArr =
        ids === undefined
          ? activeIds.length > 0
            ? [activeIds[activeIds.length - 1]]
            : []
          : Array.isArray(ids)
            ? ids
            : [ids];

      idsArr.forEach((id) => {
        dismissToast(id);
        const idx = activeIds.indexOf(id);
        if (idx !== -1) activeIds.splice(idx, 1);
      });
    };

    return {
      toast: { show, hide },
      isToastVisible: false,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return <ToastCtx.Provider value={ctx}>{children}</ToastCtx.Provider>;
}
