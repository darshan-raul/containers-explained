import React, { useRef, useState, useCallback } from 'react';

const STEPS = [
  { caption: 'myapp launched — host assigns PID 847', dot: 0 },
  { caption: 'same process enters the namespace…',    dot: 1 },
  { caption: 'namespace assigns PID 1',               dot: 2 },
  { caption: 'from its view — it IS pid 1',           dot: 3 },
];

const wait = ms => new Promise(r => setTimeout(r, ms));

export default function PidNamespaceDemo() {
  const [step, setStep]           = useState(0);
  const [busy, setBusy]           = useState(false);
  const [caption, setCaption]     = useState('press next to begin');
  const [activeDot, setActiveDot] = useState(-1);
  const [btnLabel, setBtnLabel]   = useState('next →');

  // visibility states
  const [hostNew, setHostNew]     = useState({ show: false, dim: false });
  const [nsNew, setNsNew]         = useState(false);
  const [nsActive, setNsActive]   = useState(false);
  const [thought, setThought]     = useState(false);

  // flyer position
  const [flyer, setFlyer]         = useState({ opacity: 0, x: 0, y: 0, transition: 'none' });

  const hostListRef  = useRef(null);
  const hostNewRef   = useRef(null);
  const nsBoxRef     = useRef(null);
  const nsNewRef     = useRef(null);

  const showFlyer = (x, y, transition = 'none') =>
    setFlyer({ opacity: 1, x, y, transition });
  const hideFlyer = () =>
    setFlyer(f => ({ ...f, opacity: 0 }));

  const runStep = useCallback(async (currentStep) => {
    setBusy(true);
    setBtnLabel('…');

    if (currentStep === 0) {
      // drop into host
      setCaption(STEPS[0].caption);
      setActiveDot(0);
      const listR = hostListRef.current.getBoundingClientRect();
      showFlyer(listR.left + 14, listR.top - 36);
      await wait(60);
      const destR = hostNewRef.current.getBoundingClientRect();
      showFlyer(listR.left + 14, destR.top, 'top 0.4s cubic-bezier(0.3,0,0.2,1)');
      await wait(460);
      setHostNew({ show: true, dim: false });
      hideFlyer();

    } else if (currentStep === 1) {
      // fly to namespace
      setCaption(STEPS[1].caption);
      setActiveDot(1);
      setHostNew({ show: true, dim: true });
      await wait(350);
      const srcR   = hostNewRef.current.getBoundingClientRect();
      const nsBoxR = nsBoxRef.current.getBoundingClientRect();
      showFlyer(srcR.left, srcR.top);
      await wait(60);
      setNsActive(true);
      showFlyer(nsBoxR.left + 14, nsBoxR.top + 52, 'left 0.6s cubic-bezier(0.4,0,0.2,1), top 0.6s cubic-bezier(0.4,0,0.2,1)');
      await wait(680);
      setNsNew(true);
      hideFlyer();

    } else if (currentStep === 2) {
      // show thought bubble
      setCaption(STEPS[2].caption);
      setActiveDot(2);
      await wait(300);
      setThought(true);

    } else if (currentStep === 3) {
      // final
      setCaption(STEPS[3].caption);
      setActiveDot(3);
      setBusy(false);
      setBtnLabel('↺ restart');
      setStep(4);
      return;
    }

    const next = currentStep + 1;
    setStep(next);
    setBusy(false);
    setBtnLabel(next >= STEPS.length ? '↺ restart' : 'next →');
  }, []);

  const handleClick = useCallback(() => {
    if (busy) return;
    if (step >= STEPS.length) {
      // restart
      setStep(0);
      setBusy(false);
      setBtnLabel('next →');
      setCaption('press next to begin');
      setActiveDot(-1);
      setHostNew({ show: false, dim: false });
      setNsNew(false);
      setNsActive(false);
      setThought(false);
      setFlyer({ opacity: 0, x: 0, y: 0, transition: 'none' });
      return;
    }
    runStep(step);
  }, [busy, step, runStep]);

  // ── styles ────────────────────────────────────────────────────────────────

  const s = {
    wrap: {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 24, padding: '32px 16px', fontFamily: "'JetBrains Mono', monospace",
      background: '#0b0f17', borderRadius: 12,
      margin: '24px 0',
    },
    labelRow: { display: 'flex', gap: 80 },
    boxLabel: { width: 220, textAlign: 'center', fontSize: '0.65rem',
                letterSpacing: '0.2em', textTransform: 'uppercase' },
    boxes: { display: 'flex', gap: 80, alignItems: 'flex-start', position: 'relative' },
    box: {
      width: 220, borderRadius: 8, overflow: 'hidden',
      border: '1px solid #1e2d40', background: '#0e1520',
    },
    nsBox: (active) => ({
      width: 220, borderRadius: 8, overflow: 'hidden', background: '#0e1520',
      border: `1px solid ${active ? '#2a9a6a' : '#1e2d40'}`,
      boxShadow: active ? '0 0 24px rgba(42,154,106,0.15)' : 'none',
      transition: 'border-color 0.5s, box-shadow 0.5s',
    }),
    hostHeader: {
      padding: '9px 14px', fontSize: '0.6rem', letterSpacing: '0.18em',
      textTransform: 'uppercase', borderBottom: '1px solid #2a1e0e',
      background: '#0f1008', color: '#c07830',
    },
    nsHeader: {
      padding: '9px 14px', fontSize: '0.6rem', letterSpacing: '0.18em',
      textTransform: 'uppercase', borderBottom: '1px solid #0e2a1e',
      background: '#080f0e', color: '#2a9a6a',
    },
    procList: {
      padding: '10px 8px', display: 'flex', flexDirection: 'column',
      gap: 3, minHeight: 170,
    },
    proc: {
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 8px', borderRadius: 5, fontSize: '0.68rem',
    },
    pid:  { minWidth: 38, fontWeight: 600, color: '#c07830', fontSize: '0.63rem' },
    name: { color: '#b0c8e0' },

    hostNew: (show, dim) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 8px', borderRadius: 5, fontSize: '0.68rem',
      border: '1px solid #c07830', background: 'rgba(192,120,48,0.08)',
      opacity: dim ? 0.22 : show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(-5px)',
      transition: 'opacity 0.45s ease, transform 0.45s ease',
    }),
    hostNewPid: { minWidth: 38, fontWeight: 600, color: '#ffaa44', fontSize: '0.63rem' },

    nsNew: (show) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 8px', borderRadius: 5, fontSize: '0.68rem',
      border: '1px solid #2a9a6a', background: 'rgba(42,154,106,0.08)',
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(-5px)',
      transition: 'opacity 0.45s ease, transform 0.45s ease',
    }),
    nsNewPid:  { minWidth: 38, fontWeight: 600, color: '#44ffaa', fontSize: '0.72rem' },
    nsNewName: { color: '#44ffaa' },

    flyer: (f) => ({
      position: 'fixed', pointerEvents: 'none', zIndex: 999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 10px', borderRadius: 5,
      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem',
      border: '1px solid #ffcc44', background: 'rgba(255,204,68,0.12)',
      color: '#ffe08a', boxShadow: '0 0 18px rgba(255,204,68,0.25)',
      whiteSpace: 'nowrap',
      left: f.x, top: f.y,
      opacity: f.opacity,
      transition: f.transition === 'none'
        ? 'opacity 0.3s'
        : `${f.transition}, opacity 0.3s`,
    }),
    flyerPid: { fontWeight: 600, color: '#ffcc44', minWidth: 38, fontSize: '0.63rem' },

    dots: { display: 'flex', gap: 8 },
    dot: (on) => ({
      width: 6, height: 6, borderRadius: '50%',
      background: on ? '#4a7a9a' : '#1e2d40',
      transition: 'background 0.3s',
    }),
    caption: {
      fontSize: '0.63rem', letterSpacing: '0.08em',
      color: '#4a7a9a', height: 18, textAlign: 'center',
    },
    btn: {
      background: 'transparent',
      border: '1px solid #2a4060', color: '#4a7a9a',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.62rem', letterSpacing: '0.18em',
      textTransform: 'uppercase', padding: '9px 28px',
      borderRadius: 4, cursor: busy ? 'default' : 'pointer',
      opacity: busy ? 0.4 : 1,
      transition: 'opacity 0.3s',
    },
  };

  // ── thought bubble (absolutely positioned relative to ns-new-proc) ─────────
  // We render it inline above the ns proc list instead of fixed,
  // so it works inside the Docusaurus layout without needing DOM refs for coords.
  const thoughtStyle = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.58rem', color: '#44ffaa',
    background: '#0a1f15', border: '1px solid #2a9a6a',
    borderRadius: 6, padding: '5px 10px',
    display: 'inline-block', marginBottom: 6, marginLeft: 8,
    opacity: thought ? 1 : 0,
    transition: 'opacity 0.4s',
    position: 'relative',
  };

  return (
    <>
      {/* Flyer — fixed overlay */}
      <div style={s.flyer(flyer)}>
        <span style={s.flyerPid}>847</span><span>myapp</span>
      </div>

      <div style={s.wrap}>
        {/* Labels */}
        <div style={s.labelRow}>
          <div style={{ ...s.boxLabel, color: '#5a3a10' }}>Host System</div>
          <div style={{ ...s.boxLabel, color: '#0e4a2a' }}>PID Namespace</div>
        </div>

        {/* Two boxes */}
        <div style={s.boxes}>

          {/* Host box */}
          <div style={s.box}>
            <div style={s.hostHeader}>host · global pid_ns</div>
            <div style={s.procList} ref={hostListRef}>
              <div style={s.proc}><span style={s.pid}>1</span><span style={s.name}>systemd</span></div>
              <div style={s.proc}><span style={s.pid}>183</span><span style={s.name}>sshd</span></div>
              <div style={s.proc}><span style={s.pid}>441</span><span style={s.name}>nginx</span></div>
              <div style={s.proc}><span style={s.pid}>620</span><span style={s.name}>postgres</span></div>
              <div style={s.hostNew(hostNew.show, hostNew.dim)} ref={hostNewRef}>
                <span style={s.hostNewPid}>847</span>
                <span style={s.name}>myapp</span>
              </div>
            </div>
          </div>

          {/* Namespace box */}
          <div style={s.nsBox(nsActive)} ref={nsBoxRef}>
            <div style={s.nsHeader}>container · isolated pid_ns</div>
            <div style={s.procList}>
              {/* thought bubble sits above the proc */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={thoughtStyle}>I am PID 1</span>
                <div style={s.nsNew(nsNew)} ref={nsNewRef}>
                  <span style={s.nsNewPid}>1</span>
                  <span style={s.nsNewName}>myapp</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Caption + dots + button */}
        <div style={s.caption}>{caption}</div>
        <div style={s.dots}>
          {[0,1,2,3].map(i => <div key={i} style={s.dot(activeDot === i)} />)}
        </div>
        <button style={s.btn} onClick={handleClick} disabled={busy}>
          {btnLabel}
        </button>
      </div>
    </>
  );
}