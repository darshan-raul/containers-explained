---
sidebar_position: 4
---

# Mount Namespace

### 5.3 Mount Propagation

Mount propagation determines how mount events are propagated between mount namespaces. By default, mounts are **private** – they don’t propagate. But if you create a new mount namespace with `unshare --mount`, the new namespace receives a **copy** of the parent’s mount tree, and the propagation type is **shared** for mounts that are marked shared on the host (like `/` on many systems). This can cause unexpected behavior: if you bind‑mount something in the new namespace, it may propagate back to the host if the mount point is shared.

You can control this with the `--propagation` flag. For example, to make all mounts in the new namespace private:

```bash
unshare --mount --propagation private bash
```

This is often what you want for isolation.



Without mount namespace isolation, operations like pivot_root would globally change the host's filesystem layout, and mounting a container-specific /proc would expose all host processes to the container. Mount namespaces make containers truly isolated while keeping the host system stable and secure.

This isolation is fundamental to containerization. Having a separate mount namespace enables two critical container operations:

    pivot_root – Containers need to change their perceived root filesystem to a completely new directory (like a container image). With a private mount namespace, a container can call pivot_root to switch to its own filesystem without affecting the host's mount table or other containers.

    Private /proc mounts – Each container needs its own /proc filesystem showing only its own processes. By combining a mount namespace with a PID namespace (--mount-proc), a container gets an isolated process view. The host's /proc remains untouched, and the container can safely mount its own procfs.

