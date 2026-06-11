import React, {useEffect, useState, useCallback} from 'react';
import {getRemotionEnvironment} from 'remotion';

type State = {
  mode: 'bg-anim' | 'preset';
  presetLabel: string;
  animLabel: string;
  index: number;
  total: number;
  canMark: boolean;
};

const CONTROL_URL = 'http://localhost:3001';

// 仅 Studio 预览里渲染；render 时 isStudio=false → null，绝不进视频。
export const StudioControlBar: React.FC = () => {
  if (!getRemotionEnvironment().isStudio) return null;
  return <ControlBarInner />;
};

const btn: React.CSSProperties = {
  pointerEvents: 'auto',
  cursor: 'pointer',
  border: 'none',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: 15,
  color: '#fff',
  background: '#444',
};

const ControlBarInner: React.FC = () => {
  const [state, setState] = useState<State | null>(null);
  const [marked, setMarked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${CONTROL_URL}/state`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (alive && s) setState(s as State);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const onNext = useCallback(async () => {
    setBusy(true);
    try {
      const r = await fetch(`${CONTROL_URL}/next`, {method: 'POST'});
      if (r.ok) {
        window.location.reload();
      } else {
        setBusy(false);
        // eslint-disable-next-line no-alert
        window.alert('切换超时，请手动刷新页面');
      }
    } catch {
      setBusy(false);
      // eslint-disable-next-line no-alert
      window.alert('切换失败：控制服务无响应');
    }
  }, []);

  const onMark = useCallback(async () => {
    try {
      const r = await fetch(`${CONTROL_URL}/mark`, {method: 'POST'});
      if (r.ok) setMarked(true);
      // eslint-disable-next-line no-alert
      else window.alert('标记失败');
    } catch {
      // eslint-disable-next-line no-alert
      window.alert('标记失败：控制服务无响应');
    }
  }, []);

  // 控制服务不可达（未开 --debug-bg-anim）→ 不显示任何东西。
  if (!state) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 14px',
        background: 'rgba(0,0,0,0.72)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      {state.mode === 'preset' ? (
        <span>
          preset: <b>{state.presetLabel}</b> ({state.index}/{state.total})
        </span>
      ) : (
        <>
          <span style={{opacity: 0.85}}>
            preset: <b>{state.presetLabel}</b>
          </span>
          <span style={{opacity: 0.4}}>·</span>
          <span>
            bg-anim: <b>{state.animLabel}</b> ({state.index}/{state.total})
          </span>
        </>
      )}
      <button type="button" onClick={onNext} disabled={busy} style={btn}>
        {busy ? '切换中…' : '下一个'}
      </button>
      {state.canMark && (
        <button
          type="button"
          onClick={onMark}
          style={{...btn, background: marked ? '#2e7d32' : '#444'}}
        >
          {marked ? '✓ 已标记' : '标记'}
        </button>
      )}
    </div>
  );
};
