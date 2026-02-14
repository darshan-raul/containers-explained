import React, { useState } from 'react';

const PivotRootAnimation = () => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Initial State: Host Filesystem",
      description: "We start on the host system with the normal root filesystem (/) containing all system directories.",
      code: "",
      highlights: ['host-root'],
    },
    {
      title: "Create New Mount Namespace",
      description: "We create a new mount namespace using unshare. This isolates our mount points from the host.",
      code: "unshare --mount /bin/bash",
      highlights: ['mount-ns'],
    },
    {
      title: "Prepare New Root Directory",
      description: "We create a directory that will become our new root. This is typically a minimal filesystem with just what the container needs.",
      code: "mkdir -p /tmp/new_root\n# Copy essential files\ncp -r /bin /lib /lib64 /tmp/new_root/",
      highlights: ['new-root-prep'],
    },
    {
      title: "Create Old Root Directory",
      description: "Inside our new root, create a directory to temporarily hold the old root filesystem.",
      code: "mkdir -p /tmp/new_root/old_root",
      highlights: ['new-root-prep', 'old-root-dir'],
    },
    {
      title: "Make New Root a Mount Point",
      description: "Bind mount the new root to itself. This is required for pivot_root to work.",
      code: "mount --bind /tmp/new_root /tmp/new_root",
      highlights: ['new-root-mount'],
    },
    {
      title: "Execute pivot_root",
      description: "pivot_root changes the root filesystem. The old root gets moved to /old_root inside the new root.",
      code: "cd /tmp/new_root\npivot_root . old_root",
      highlights: ['pivot-moment'],
    },
    {
      title: "After pivot_root: New Perspective",
      description: "Now we're inside the new root! What was /tmp/new_root is now /. The old root is accessible at /old_root.",
      code: "# We are now in the new root\npwd  # Shows /",
      highlights: ['new-root-active'],
    },
    {
      title: "Unmount Old Root",
      description: "Clean up by unmounting the old root filesystem. Now it's completely hidden from our view.",
      code: "umount -l /old_root\nrmdir /old_root",
      highlights: ['old-root-unmount'],
    },
    {
      title: "Complete Isolation",
      description: "We now have a completely isolated root filesystem! The process can only see /tmp/new_root (as /) and has no access to the original host filesystem.",
      code: "ls /  # Only shows new root contents\n# Original /tmp, /var, etc. are invisible!",
      highlights: ['complete-isolation'],
    },
  ];

  const currentStep = steps[step];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const reset = () => {
    setStep(0);
  };

  const styles = {
    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      background: 'linear-gradient(to bottom right, #f8fafc, #e0e7ff)',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#64748b',
      fontSize: '16px',
    },
    progressContainer: {
      marginBottom: '24px',
    },
    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px',
    },
    progressText: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#334155',
    },
    progressBarBg: {
      width: '100%',
      backgroundColor: '#e2e8f0',
      borderRadius: '9999px',
      height: '12px',
      overflow: 'hidden',
    },
    progressBarFill: {
      background: 'linear-gradient(to right, #3b82f6, #6366f1)',
      height: '100%',
      borderRadius: '9999px',
      transition: 'width 0.5s ease-out',
    },
    stepCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '24px',
      marginBottom: '24px',
    },
    stepHeader: {
      display: 'flex',
      gap: '16px',
      marginBottom: '16px',
      alignItems: 'flex-start',
    },
    stepNumber: {
      flexShrink: 0,
      width: '48px',
      height: '48px',
      backgroundColor: '#6366f1',
      color: 'white',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '20px',
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '8px',
    },
    stepDescription: {
      color: '#64748b',
      fontSize: '18px',
      lineHeight: '1.6',
    },
    codeBlock: {
      backgroundColor: '#0f172a',
      color: '#4ade80',
      padding: '16px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '14px',
      marginTop: '16px',
      overflow: 'auto',
    },
    codeComment: {
      color: '#64748b',
      marginBottom: '8px',
    },
    visualCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      marginBottom: '24px',
      minHeight: '400px',
    },
    visualTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1e293b',
      marginBottom: '16px',
    },
    fileTree: {
      border: '2px solid',
      borderRadius: '8px',
      padding: '12px',
      transition: 'all 0.5s',
      fontFamily: 'monospace',
      fontSize: '14px',
    },
    fileTreeFolder: {
      marginTop: '4px',
      marginBottom: '4px',
    },
    badge: {
      display: 'inline-block',
      padding: '8px 16px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '14px',
      marginBottom: '16px',
    },
    buttonContainer: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    button: {
      flex: 1,
      padding: '12px 24px',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '16px',
    },
    buttonDisabled: {
      backgroundColor: '#e2e8f0',
      color: '#94a3b8',
      cursor: 'not-allowed',
    },
    buttonPrimary: {
      backgroundColor: '#6366f1',
      color: 'white',
    },
    buttonSecondary: {
      backgroundColor: '#64748b',
      color: 'white',
    },
    buttonDanger: {
      backgroundColor: '#ef4444',
      color: 'white',
      flex: 'none',
    },
    infoBox: {
      padding: '16px',
      borderRadius: '8px',
      border: '2px solid',
      marginTop: '16px',
    },
    keyConceptsBox: {
      marginTop: '24px',
      backgroundColor: '#1e3a8a',
      color: 'white',
      borderRadius: '8px',
      padding: '24px',
    },
    commandBox: {
      marginTop: '24px',
      backgroundColor: '#1e293b',
      color: 'white',
      borderRadius: '8px',
      padding: '24px',
    },
    twoColumnGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
    },
    centerFlex: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '24px',
    },
    spinAnimation: {
      animation: 'spin 2s linear infinite',
    },
  };

  // Filesystem visualization component
  const FileTree = ({ type, isHighlighted, opacity = 1 }) => {
    const getStyle = () => {
      let borderColor = '#cbd5e1';
      let backgroundColor = 'white';
      
      if (type === 'host' && currentStep.highlights.includes('host-root')) {
        borderColor = '#3b82f6';
        backgroundColor = '#eff6ff';
      }
      if (type === 'new-root' && currentStep.highlights.includes('new-root-prep')) {
        borderColor = '#10b981';
        backgroundColor = '#f0fdf4';
      }
      if (type === 'new-root' && currentStep.highlights.includes('new-root-mount')) {
        borderColor = '#f59e0b';
        backgroundColor = '#fffbeb';
      }
      if (type === 'new-root' && currentStep.highlights.includes('new-root-active')) {
        borderColor = '#059669';
        backgroundColor = '#d1fae5';
      }
      if (type === 'old-root' && currentStep.highlights.includes('old-root-dir')) {
        borderColor = '#f97316';
        backgroundColor = '#fff7ed';
      }
      
      return {
        ...styles.fileTree,
        borderColor,
        backgroundColor,
        opacity,
      };
    };

    return (
      <div style={getStyle()}>
        {type === 'host' && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px', color: '#1e293b' }}>
              / (Host Root)
            </div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /bin</div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /boot</div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /dev</div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /etc</div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /home</div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /lib</div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /lib64</div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /proc</div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /sys</div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /tmp</div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /usr</div>
            <div style={{ ...styles.fileTreeFolder, color: '#3b82f6' }}>📁 /var</div>
          </div>
        )}
        {type === 'new-root' && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px', color: '#059669' }}>
              {step < 6 ? '/tmp/new_root' : '/ (New Root)'}
            </div>
            {step >= 2 && (
              <>
                <div style={{ ...styles.fileTreeFolder, color: '#10b981' }}>📁 /bin</div>
                <div style={{ ...styles.fileTreeFolder, color: '#10b981' }}>📁 /lib</div>
                <div style={{ ...styles.fileTreeFolder, color: '#10b981' }}>📁 /lib64</div>
              </>
            )}
            {step >= 3 && step < 8 && (
              <div style={{ 
                ...styles.fileTreeFolder, 
                color: currentStep.highlights.includes('old-root-dir') ? '#f97316' : '#10b981',
                fontWeight: currentStep.highlights.includes('old-root-dir') ? 'bold' : 'normal',
              }}>
                📁 /old_root
              </div>
            )}
            {step >= 6 && step < 8 && (
              <div style={{ marginLeft: '16px', color: '#64748b', fontSize: '12px', borderLeft: '2px solid #cbd5e1', paddingLeft: '8px', marginTop: '4px' }}>
                <div>→ Original host root mounted here</div>
              </div>
            )}
          </div>
        )}
        {type === 'old-root-mounted' && step >= 6 && step < 8 && (
          <div style={{ marginLeft: '24px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: '#c2410c' }}>
              /old_root (Old Host Root)
            </div>
            <div style={{ ...styles.fileTreeFolder, color: '#fb923c', fontSize: '12px' }}>📁 /bin</div>
            <div style={{ ...styles.fileTreeFolder, color: '#fb923c', fontSize: '12px' }}>📁 /boot</div>
            <div style={{ ...styles.fileTreeFolder, color: '#fb923c', fontSize: '12px' }}>📁 /dev</div>
            <div style={{ ...styles.fileTreeFolder, color: '#fb923c', fontSize: '12px' }}>📁 /etc</div>
            <div style={{ ...styles.fileTreeFolder, color: '#94a3b8', fontSize: '12px' }}>...</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>pivot_root: Changing the Root Filesystem</h2>
        <p style={styles.subtitle}>
          See how containers create isolated filesystem views using pivot_root
        </p>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressHeader}>
          <span style={styles.progressText}>
            Step {step + 1} of {steps.length}
          </span>
          <span style={{ ...styles.progressText, color: '#64748b' }}>
            {Math.round(((step + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div style={styles.progressBarBg}>
          <div 
            style={{
              ...styles.progressBarFill,
              width: `${((step + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Step Card */}
      <div style={styles.stepCard}>
        <div style={styles.stepHeader}>
          <div style={styles.stepNumber}>{step + 1}</div>
          <div style={styles.stepContent}>
            <h3 style={styles.stepTitle}>{currentStep.title}</h3>
            <p style={styles.stepDescription}>{currentStep.description}</p>
          </div>
        </div>

        {currentStep.code && (
          <div style={styles.codeBlock}>
            <div style={styles.codeComment}># Command:</div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{currentStep.code}</pre>
          </div>
        )}
      </div>

      {/* Visualization Area */}
      <div style={styles.visualCard}>
        <h4 style={styles.visualTitle}>Filesystem View</h4>

        {/* Step 0: Initial Host */}
        {step === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '320px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1e40af' }}>
                  Host System
                </span>
              </div>
              <FileTree type="host" />
            </div>
          </div>
        )}

        {/* Step 1: Mount Namespace Created */}
        {step === 1 && (
          <div style={styles.centerFlex}>
            <div style={{ width: '320px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1e40af' }}>
                  Host System
                </span>
              </div>
              <FileTree type="host" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '40px' }}>🔄</div>
              <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '120px', textAlign: 'center' }}>
                New Mount Namespace Created
              </div>
            </div>
            <div style={{ width: '320px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ ...styles.badge, backgroundColor: '#f3e8ff', color: '#6b21a8' }}>
                  New Mount NS
                </span>
              </div>
              <FileTree type="host" />
              <div style={{ fontSize: '12px', textAlign: 'center', color: '#64748b', marginTop: '8px' }}>
                (Initially sees same mounts)
              </div>
            </div>
          </div>
        )}

        {/* Steps 2-5: Preparation */}
        {step >= 2 && step <= 5 && (
          <div>
            <div style={styles.twoColumnGrid}>
              <div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1e40af' }}>
                    Current View: Host Root
                  </span>
                </div>
                <FileTree type="host" opacity={0.5} />
              </div>
              <div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ ...styles.badge, backgroundColor: '#d1fae5', color: '#065f46' }}>
                    Preparing: /tmp/new_root
                  </span>
                </div>
                <FileTree type="new-root" />
              </div>
            </div>

            {step === 5 && (
              <div style={{ 
                ...styles.infoBox, 
                backgroundColor: '#fffbeb', 
                borderColor: '#f59e0b',
                marginTop: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>⚠️</span>
                  <span style={{ fontWeight: 'bold', color: '#92400e' }}>Ready for pivot_root</span>
                </div>
                <div style={{ fontSize: '14px', color: '#78350f' }}>
                  /tmp/new_root is now bind-mounted to itself and contains an old_root directory.
                  We're ready to switch!
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Pivot Moment */}
        {step === 6 && (
          <div>
            <div style={styles.centerFlex}>
              <div style={{ width: '320px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ 
                    ...styles.badge, 
                    backgroundColor: '#dbeafe', 
                    color: '#1e40af',
                    textDecoration: 'line-through',
                  }}>
                    Old: /
                  </span>
                </div>
                <FileTree type="host" opacity={0.3} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '60px' }}>
                  <style>
                    {`
                      @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                      }
                    `}
                  </style>
                  <span style={{ display: 'inline-block', animation: 'spin 2s linear infinite' }}>🔄</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6366f1' }}>
                  pivot_root!
                </div>
              </div>

              <div style={{ width: '320px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ ...styles.badge, backgroundColor: '#d1fae5', color: '#065f46' }}>
                    New: /
                  </span>
                </div>
                <FileTree type="new-root" />
              </div>
            </div>

            <div style={{ 
              ...styles.infoBox, 
              backgroundColor: '#e0e7ff', 
              borderColor: '#6366f1',
              marginTop: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                <span style={{ fontWeight: 'bold', color: '#3730a3' }}>The Magic Happens!</span>
              </div>
              <div style={{ fontSize: '14px', color: '#4338ca' }}>
                The kernel switches the root filesystem. What was /tmp/new_root becomes /.
                The old root is now accessible at /old_root.
              </div>
            </div>
          </div>
        )}

        {/* Step 7: After Pivot with Old Root */}
        {step === 7 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '384px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ 
                    ...styles.badge, 
                    backgroundColor: '#d1fae5', 
                    color: '#065f46',
                    fontSize: '18px',
                  }}>
                    Current Root: /
                  </span>
                </div>
                <FileTree type="new-root" />
                <div style={{ marginTop: '16px' }}>
                  <FileTree type="old-root-mounted" />
                </div>
              </div>
            </div>

            <div style={{ 
              ...styles.infoBox, 
              backgroundColor: '#f0fdf4', 
              borderColor: '#10b981',
              marginTop: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>🎯</span>
                <span style={{ fontWeight: 'bold', color: '#065f46' }}>New Root Active!</span>
              </div>
              <div style={{ fontSize: '14px', color: '#047857' }}>
                We're now inside the new root. The old host filesystem is still accessible at /old_root,
                but we'll remove it next for complete isolation.
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Complete Isolation */}
        {step === 8 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '384px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ 
                    ...styles.badge, 
                    backgroundColor: '#059669', 
                    color: 'white',
                    fontSize: '18px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}>
                    ✓ Isolated Root: /
                  </span>
                </div>
                <FileTree type="new-root" />
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  backgroundColor: '#f1f5f9', 
                  borderRadius: '8px', 
                  border: '2px solid #cbd5e1',
                  textAlign: 'center',
                }}>
                  <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '14px', marginBottom: '8px' }}>
                    /old_root unmounted and removed
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    The original host filesystem is now completely invisible!
                  </div>
                </div>
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#059669', 
              color: 'white', 
              borderRadius: '8px', 
              padding: '24px',
              marginTop: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '40px' }}>🎉</span>
                <span style={{ fontWeight: 'bold', fontSize: '24px' }}>Complete Isolation Achieved!</span>
              </div>
              <div style={{ color: '#d1fae5', lineHeight: '1.8' }}>
                <p style={{ margin: '8px 0' }}>✓ The process can ONLY see /tmp/new_root (as /)</p>
                <p style={{ margin: '8px 0' }}>✓ Original /tmp, /var, /home are completely hidden</p>
                <p style={{ margin: '8px 0' }}>✓ This is exactly what containers do to isolate filesystems!</p>
                <p style={{ margin: '16px 0 0 0', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                  <strong>Result:</strong> The process believes /tmp/new_root is the entire filesystem.
                  This creates the "container illusion" of having its own isolated system.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={styles.buttonContainer}>
        <button
          onClick={prevStep}
          disabled={step === 0}
          style={{
            ...styles.button,
            ...(step === 0 ? styles.buttonDisabled : styles.buttonSecondary),
          }}
          onMouseEnter={(e) => {
            if (step !== 0) e.target.style.backgroundColor = '#475569';
          }}
          onMouseLeave={(e) => {
            if (step !== 0) e.target.style.backgroundColor = '#64748b';
          }}
        >
          ← Previous
        </button>

        <button
          onClick={reset}
          style={{...styles.button, ...styles.buttonDanger}}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
        >
          🔄 Reset
        </button>

        <button
          onClick={nextStep}
          disabled={step === steps.length - 1}
          style={{
            ...styles.button,
            ...(step === steps.length - 1 ? styles.buttonDisabled : styles.buttonPrimary),
          }}
          onMouseEnter={(e) => {
            if (step !== steps.length - 1) e.target.style.backgroundColor = '#4f46e5';
          }}
          onMouseLeave={(e) => {
            if (step !== steps.length - 1) e.target.style.backgroundColor = '#6366f1';
          }}
        >
          Next →
        </button>
      </div>

      {/* Key Concepts */}
      <div style={styles.keyConceptsBox}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>🔑 Key Concepts</h3>
        <div style={{ color: '#bfdbfe', fontSize: '14px', lineHeight: '1.8' }}>
          <p style={{ margin: '8px 0' }}>
            <strong style={{ color: 'white' }}>pivot_root:</strong> System call that changes the root mount in the current mount namespace
          </p>
          <p style={{ margin: '8px 0' }}>
            <strong style={{ color: 'white' }}>Mount Namespace:</strong> Isolates the mount point tree, allowing different processes to have different views of the filesystem
          </p>
          <p style={{ margin: '8px 0' }}>
            <strong style={{ color: 'white' }}>Why not chroot?</strong> chroot can be escaped; pivot_root in a mount namespace provides real isolation
          </p>
          <p style={{ margin: '8px 0' }}>
            <strong style={{ color: 'white' }}>Container Use:</strong> Docker/Podman use this technique to give containers their own root filesystem
          </p>
          <p style={{ margin: '16px 0 0 0', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
            <em>This is how containers get their own isolated filesystem view while running on the same kernel!</em>
          </p>
        </div>
      </div>

      {/* Command Reference */}
      <div style={styles.commandBox}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>💻 Complete Command Sequence</h3>
        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: '14px', 
          color: '#4ade80',
          backgroundColor: '#0f172a',
          padding: '16px',
          borderRadius: '8px',
          lineHeight: '1.8',
        }}>
          <div style={{ color: '#64748b', marginTop: '12px' }}># 1. Create mount namespace</div>
          <div>unshare --mount /bin/bash</div>
          
          <div style={{ color: '#64748b', marginTop: '12px' }}># 2. Prepare new root</div>
          <div>mkdir -p /tmp/new_root</div>
          <div>cp -r /bin /lib /lib64 /etc /tmp/new_root/</div>
          
          <div style={{ color: '#64748b', marginTop: '12px' }}># 3. Create old_root directory</div>
          <div>mkdir -p /tmp/new_root/old_root</div>
          
          <div style={{ color: '#64748b', marginTop: '12px' }}># 4. Bind mount new root</div>
          <div>mount --bind /tmp/new_root /tmp/new_root</div>
          
          <div style={{ color: '#64748b', marginTop: '12px' }}># 5. Change to new root and pivot</div>
          <div>cd /tmp/new_root</div>
          <div>pivot_root . old_root</div>
          
          <div style={{ color: '#64748b', marginTop: '12px' }}># 6. Unmount old root</div>
          <div>umount -l /old_root</div>
          <div>rmdir /old_root</div>
          
          <div style={{ color: '#64748b', marginTop: '12px' }}># Now you're in an isolated root!</div>
          <div>ls /  <span style={{ color: '#64748b' }}># Only shows new_root contents</span></div>
        </div>
      </div>
    </div>
  );
};

export default PivotRootAnimation;