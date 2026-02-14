import React, { useState } from 'react';

const NamespaceVisualizer = () => {
  const [mode, setMode] = useState('unshare'); // unshare, clone, nsenter
  const [step, setStep] = useState(0); // 0 = initial, 1 = final

  // Colors
  const HOST_COLOR = '#e2e8f0'; // Slate 200
  const HOST_BORDER = '#94a3b8'; // Slate 400
  const NS_COLOR = '#bbf7d0'; // Green 200
  const NS_BORDER = '#22c55e'; // Green 500
  const PROC_COLOR = '#3b82f6'; // Blue 500
  const PROC_TEXT = '#ffffff';

  const reset = (newMode) => {
    setMode(newMode);
    setStep(0);
  };

  const descriptions = {
    unshare: {
      title: 'unshare',
      subtitle: 'Create new namespace for current process',
      desc: 'The process disconnects from the Host Namespace and wraps itself in a NEW Namespace. (CLI usage usually runs a child process here, but the concept is isolation from the original context).',
    },
    clone: {
      title: 'clone',
      subtitle: 'Create child process in new namespace',
      desc: 'The Parent process stays in the Host. It spawns a Child process directly into a NEW Namespace. The Parent and Child are now isolated.',
    },
    nsenter: {
      title: 'nsenter',
      subtitle: 'Enter an existing namespace',
      desc: 'Process A is in the Host. Process B is already in a Namespace. Process A "enters" Process B\'s Namespace to debug or run commands alongside it.',
    },
  };

  // SVG Icons for visualization
  const ProcessIcon = ({ label, isChild = false }) => (
    <div
      style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: isChild ? '#8b5cf6' : PROC_COLOR, // Purple if child, Blue if parent
        color: PROC_TEXT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '14px',
        border: '2px solid white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: 10,
        transition: 'all 0.5s ease-in-out',
      }}
    >
      {label}
    </div>
  );

  const NamespaceBox = ({ children, label, isHost = false }) => (
    <div
      style={{
        border: `3px dashed ${isHost ? HOST_BORDER : NS_BORDER}`,
        backgroundColor: isHost ? HOST_COLOR : NS_COLOR,
        borderRadius: '12px',
        padding: '20px',
        position: 'relative',
        minHeight: '160px',
        minWidth: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.5s ease-in-out',
        margin: '10px',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '-12px',
          left: '20px',
          backgroundColor: isHost ? HOST_BORDER : NS_BORDER,
          color: 'white',
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '700px',
        margin: '20px auto',
        backgroundColor: '#fff',
        color: '#333'
      }}
    >
      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['unshare', 'clone', 'nsenter'].map((m) => (
          <button
            key={m}
            onClick={() => reset(m)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              backgroundColor: mode === m ? '#0f172a' : '#f1f5f9',
              color: mode === m ? '#fff' : '#475569',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Description */}
      <div style={{ marginBottom: '20px', height: '80px' }}>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>
          {descriptions[mode].title}: <span style={{fontWeight: 'normal', fontSize: '16px'}}>{descriptions[mode].subtitle}</span>
        </h3>
        <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
          {descriptions[mode].desc}
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={() => setStep(step === 0 ? 1 : 0)}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: step === 0 ? '#2563eb' : '#64748b',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'background-color 0.2s',
        }}
      >
        {step === 0 ? '▶ Run Command' : '↺ Reset'}
      </button>

      {/* Visualization Stage */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '250px' }}>
        
        {/* --- UNSHARE SCENARIO --- */}
        {mode === 'unshare' && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {step === 0 ? (
               <NamespaceBox label="Host Namespace (PID 100)" isHost>
                 <ProcessIcon label="Proc A" />
               </NamespaceBox>
            ) : (
               <div style={{ display: 'flex', gap: '20px' }}>
                 <NamespaceBox label="Host Namespace (PID 100)" isHost>
                    <span style={{color: '#94a3b8', fontSize: '12px', fontStyle: 'italic'}}>Empty</span>
                 </NamespaceBox>
                 <NamespaceBox label="New Namespace (PID 1)">
                    <ProcessIcon label="Proc A" />
                 </NamespaceBox>
               </div>
            )}
          </div>
        )}

        {/* --- CLONE SCENARIO --- */}
        {mode === 'clone' && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NamespaceBox label="Host Namespace (PID 100)" isHost>
               <ProcessIcon label="Parent" />
            </NamespaceBox>
            
            <div style={{ width: '50px', height: '2px', backgroundColor: '#cbd5e1', margin: '0 10px' }} />

            {step === 0 ? (
               <div style={{ width: '200px', height: '160px', border: '2px dashed #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                 New Namespace
               </div>
            ) : (
               <NamespaceBox label="New Namespace (PID 1)">
                 <ProcessIcon label="Child" isChild />
               </NamespaceBox>
            )}
          </div>
        )}

        {/* --- NSENTER SCENARIO --- */}
        {mode === 'nsenter' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <NamespaceBox label="Host Namespace" isHost>
              {/* If step is 0, Proc A is here. If step is 1, Proc A is gone (moved) */}
              {step === 0 ? (
                <ProcessIcon label="Proc A" />
              ) : (
                <span style={{color: '#94a3b8', fontSize: '12px', fontStyle: 'italic'}}>A left</span>
              )}
            </NamespaceBox>

            <div style={{ fontSize: '24px', color: '#94a3b8' }}>→</div>

            <NamespaceBox label="Existing Namespace">
              <ProcessIcon label="Proc B" isChild />
              {step === 1 && <ProcessIcon label="Proc A" />}
            </NamespaceBox>
          </div>
        )}

      </div>
    </div>
  );
};

export default NamespaceVisualizer;