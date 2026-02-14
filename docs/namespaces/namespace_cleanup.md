---
sidebar_position: 10
---

# Namespace Cleanup 

### 1. Automatic Destruction

Namespaces are **temporary** by default. Use the rule of efficient laziness:

> A namespace exists only as long as **something** is using it.

When you `exit` your unshared shell:
1. The shell process dies.
2. The kernel sees zero processes using that namespace.
3. The kernel destroys the namespace and frees its resources.

### 2. What Persists?

While the namespace itself is gone, changes you made to the **host** might remain.

*   **Files created on shared mounts**: If you wrote a file to a directory that was shared with the host (or not isolated), that file stays.
*   **Directories used for mount points**: If you created `mkdir /tmp/myroot`, the directory stays.

**What about Network Interfaces?**
If you used a `veth` pair:
*   When the namespace end (`veth1`) is destroyed, the host end (`veth0`) is **automatically destroyed** by the kernel.
*   So network cleanup is usually automatic for veth pairs!

### 3. How to keep a namespace alive? (Persistence)

Sometimes you *don't* want a namespace to die when the process exits (e.g., a persistent network namespace).

You can "pin" a namespace by **bind mounting** it to a file.

```bash
touch /tmp/my-saved-ns
mount --bind /proc/$$/ns/net /tmp/my-saved-ns
```

Now, even if the process exits, the namespace (and its network settings) stays alive because the filesystem is "holding" a reference to it. This is exactly how commands like `ip netns add` work!