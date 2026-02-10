
import React, { useRef, useState, useCallback } from 'react';

const STEPS = [
    { caption: 'user runs: unshare --uts /bin/bash', dot: 0 },
    { caption: 'new namespace created...', dot: 1 },
    { caption: 'process joins new namespace', dot: 2 },
    { caption: 'hostname changed inside namespace', dot: 3 },
];

const wait = ms => new Promise(r => setTimeout(r, ms));

export default function UnshareDemo() {
    const [step, setStep] = useState(0);
    const [busy, setBusy] = useState(false);
    const [caption, setCaption] = useState('press next to begin');
    const [activeDot, setActiveDot] = useState(-1);
    const [btnLabel, setBtnLabel] = useState('next →');

    // visibility states
    const [nsBoxVisible, setNsBoxVisible] = useState(false);
    const [nsProcVisible, setNsProcVisible] = useState(false);
    const [nsHostname, setNsHostname] = useState('worker-node');
    const [commandVisible, setCommandVisible] = useState(false);

    // flyer position
    const [flyer, setFlyer] = useState({ opacity: 0, x: 0, y: 0, transition: 'none', content: '' });

    const nsListRef = useRef(null);
    const cmdRef = useRef(null);

    const showFlyer = (x, y, content, transition = 'none') =>
        setFlyer({ opacity: 1, x, y, content, transition });
    const hideFlyer = () =>
        setFlyer(f => ({ ...f, opacity: 0 }));

    const runStep = useCallback(async (currentStep) => {
        setBusy(true);
        setBtnLabel('…');

        if (currentStep === 0) {
            // 1. Show command appearing
            setCaption(STEPS[0].caption);
            setActiveDot(0);
            setCommandVisible(true);
            await wait(800);
            setBusy(false);
            setBtnLabel('next →');
            setStep(1);

        } else if (currentStep === 1) {
            // 2. Create Namespace Box
            setCaption(STEPS[1].caption);
            setActiveDot(1);
            setNsBoxVisible(true);
            await wait(600);
            setBusy(false);
            setBtnLabel('next →');
            setStep(2);

        } else if (currentStep === 2) {
            // 3. Move process from command/host to new namespace
            setCaption(STEPS[2].caption);
            setActiveDot(2);

            // Animate from command area to new namespace
            // Check if refs are available
            if (cmdRef.current && nsListRef.current) {
                const cmdR = cmdRef.current.getBoundingClientRect();
                const destR = nsListRef.current.getBoundingClientRect();

                showFlyer(cmdR.left, cmdR.top, 'bash');
                await wait(50);

                // Fly into the box
                showFlyer(destR.left + 20, destR.top + 10, 'bash', 'all 0.6s cubic-bezier(0.3,0,0.2,1)');
                await wait(600);
            }

            setNsProcVisible(true);
            hideFlyer();
            await wait(200);

            setBusy(false);
            setBtnLabel('next →');
            setStep(3);

        } else if (currentStep === 3) {
            // 4. Change Hostname
            setCaption(STEPS[3].caption);
            setActiveDot(3);

            await wait(400);
            setNsHostname('container-1');
            await wait(200);

            setBusy(false);
            setBtnLabel('↺ restart');
            setStep(4);
        }
    }, []);

    const handleClick = useCallback(() => {
        if (busy) return;
        if (step >= 4) {
            // restart
            setStep(0);
            setBusy(false);
            setBtnLabel('next →');
            setCaption('press next to begin');
            setActiveDot(-1);
            setNsBoxVisible(false);
            setNsProcVisible(false);
            setNsHostname('worker-node');
            setCommandVisible(false);
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
            position: 'relative', overflow: 'hidden' // contain flyers if needed
        },

        // Scene Container
        scene: {
            display: 'flex', gap: 40, alignItems: 'flex-start', minHeight: 180,
            position: 'relative', width: '100%', justifyContent: 'center'
        },

        // HOST Box
        hostBox: {
            width: 220, borderRadius: 8, overflow: 'hidden',
            border: '1px solid #c07830', background: '#1a1208',
            display: 'flex', flexDirection: 'column', height: 160
        },
        hostHeader: {
            padding: '8px 12px', fontSize: '0.6rem', letterSpacing: '0.1em',
            textTransform: 'uppercase', borderBottom: '1px solid #3a2510',
            background: '#2a1a0a', color: '#c07830',
            display: 'flex', justifyContent: 'space-between'
        },
        procList: {
            padding: '12px', display: 'flex', flexDirection: 'column', gap: 6,
        },
        proc: {
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 8px', borderRadius: 5, fontSize: '0.68rem',
            background: 'rgba(255,255,255,0.03)'
        },
        pid: { minWidth: 24, fontWeight: 600, color: '#888', fontSize: '0.63rem' },

        // Command Area (floating)
        cmdArea: {
            position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, pointerEvents: 'none',
            opacity: commandVisible ? 1 : 0, transition: 'opacity 0.3s',
            background: '#000', border: '1px solid #444', borderRadius: 4,
            padding: '6px 10px', color: '#fff', fontSize: '0.7rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        },

        // NEW Namespace Box
        nsBox: {
            width: 220, borderRadius: 8, overflow: 'hidden',
            border: '1px solid #2a9a6a', background: '#0a1a12',
            display: 'flex', flexDirection: 'column', height: 160,
            opacity: nsBoxVisible ? 1 : 0,
            transform: nsBoxVisible ? 'scale(1)' : 'scale(0.95)',
            transition: 'opacity 0.4s ease, transform 0.4s ease'
        },
        nsHeader: {
            padding: '8px 12px', fontSize: '0.6rem', letterSpacing: '0.1em',
            textTransform: 'uppercase', borderBottom: '1px solid #0e2a1e',
            background: '#081a14', color: '#2a9a6a',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        },

        // Process in new NS
        nsProc: {
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 8px', borderRadius: 5, fontSize: '0.68rem',
            background: 'rgba(42,154,106,0.15)', border: '1px solid #2a9a6a',
            opacity: nsProcVisible ? 1 : 0, transition: 'opacity 0.3s',
            color: '#44ffaa'
        },

        // Flyer
        flyer: (f) => ({
            position: 'fixed', pointerEvents: 'none', zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 10px', borderRadius: 5,
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem',
            border: '1px solid #fff', background: '#333',
            color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            left: f.x, top: f.y,
            opacity: f.opacity,
            transition: f.transition === 'none'
                ? 'opacity 0.3s'
                : `${f.transition}, opacity 0.3s`,
        }),

        // Controls
        controls: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 10 },
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

    return (
        <>
            <div style={s.flyer(flyer)}>
                <span>{flyer.content}</span>
            </div>

            <div style={s.wrap}>

                <div style={s.scene}>

                    {/* Command Overlay - Centered absolutely */}
                    <div style={s.cmdArea} ref={cmdRef}>
                        &gt; unshare --uts /bin/bash
                    </div>

                    {/* Host UTS Namespace */}
                    <div style={s.hostBox}>
                        <div style={s.hostHeader}>
                            <span>Host UTS</span>
                            <span style={{ color: '#888' }}>worker-node</span>
                        </div>
                        <div style={s.procList}>
                            <div style={s.proc}><span style={s.pid}>1</span><span>systemd</span></div>
                            <div style={s.proc}><span style={s.pid}>440</span><span>sshd</span></div>
                            <div style={s.proc}><span style={s.pid}>502</span><span>dockerd</span></div>
                            <div style={{ ...s.proc, opacity: 0.5 }}>...others</div>
                        </div>
                    </div>

                    {/* Spacer to separate boxes */}
                    <div style={{ width: 20 }}></div>

                    {/* New Namespace */}
                    <div style={s.nsBox}>
                        <div style={s.nsHeader}>
                            <span>New UTS</span>
                            <span style={{ color: nsHostname === 'worker-node' ? '#666' : '#44ffaa' }}>
                                {nsHostname}
                            </span>
                        </div>
                        <div style={s.procList} ref={nsListRef}>
                            <div style={s.nsProc}>
                                <span style={{ ...s.pid, color: '#4fba85' }}>PID?</span>
                                <span>/bin/bash</span>
                            </div>
                            {nsProcVisible && (
                                <div style={{ fontSize: '0.55rem', color: '#666', marginTop: 10, textAlign: 'center' }}>
                                    * isolated host/domain name
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div style={s.controls}>
                    <div style={s.caption}>{caption}</div>
                    <div style={s.dots}>
                        {[0, 1, 2, 3].map(i => <div key={i} style={s.dot(activeDot === i)} />)}
                    </div>
                    <button style={s.btn} onClick={handleClick} disabled={busy}>
                        {btnLabel}
                    </button>
                </div>

            </div>
        </>
    );
}
