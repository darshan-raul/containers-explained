---
sidebar_position: 8
---
# User Namespaces

> Run as "root", not root

### 5.4 User Namespace Details

- **ID mapping**: When you use `--map-root-user`, it sets up a mapping that maps your UID to 0 inside the namespace. You can also create custom mappings with `--map-user` and `--map-group` (advanced).
- **Capabilities**: Inside a user namespace, a process can have capabilities even if it’s unprivileged outside. However, these capabilities are only effective for resources tied to that namespace (e.g., mounting in a mount namespace that is also owned by that user namespace).
- **Interaction with other namespaces**: A user namespace is often the “owner” of other namespaces. For instance, if you create a new mount namespace while also in a new user namespace, the mount namespace is owned by that user namespace. That’s why unprivileged users can create mount namespaces (with `--user --mount`).

### 3.5 User Namespace

**Goal**: Demonstrate that an unprivileged user can map itself to root inside a user namespace and gain capabilities.

User namespaces allow a non‑root user to have root privileges *inside* the namespace, while remaining unprivileged outside. This is key for safe container runtimes.

1. As a normal (non‑root) user, run:
   ```bash
   unshare --user --map-root-user bash
   ```
   - `--user` creates a new user namespace.
   - `--map-root-user` maps the current user to root inside the namespace (i.e., UID 0 inside corresponds to your UID outside).

2. Inside, check your user ID:
   ```bash
   id
   ```
   Output: `uid=0(root) gid=0(root) groups=0(root)`. You are root! Check capabilities:
   ```bash
   cat /proc/$$/status | grep CapEff
   ```
   The capability set will include many privileged capabilities (e.g., `000001ffffffffff`). You have full power inside the namespace.

3. Try to do something privileged, like mounting a tmpfs:
   ```bash
   mkdir /tmp/mymount
   mount -t tmpfs tmpfs /tmp/mymount
   ```
   This works because inside the user namespace you have `CAP_SYS_ADMIN`. However, note that this mount is also isolated in the mount namespace? Wait – we didn’t unshare mount namespace. Actually, by default, user namespaces alone don’t isolate mounts; you need `--mount` as well. But the mount operation succeeds because you have the capability. It will affect the mount namespace you are in (which is shared with the host if you didn’t unshare mount). So be careful: if you mount something, it will be visible on the host because you’re still in the host’s mount namespace. Let’s check:

   In the same shell, run `mount | grep tmpfs` – you’ll see the tmpfs mount. From the host, you’ll also see it! That’s because we didn’t isolate the mount namespace.

   To get proper isolation, combine user and mount namespaces:
   ```bash
   unshare --user --map-root-user --mount bash
   ```
   Now mount a tmpfs; it won’t appear on the host. This is exactly how unprivileged containers work.

4. **Check namespace IDs**: In the user namespace, run `readlink /proc/self/ns/user` – it will be different from the host’s user namespace.

**Note**: Some distributions restrict unprivileged user namespaces by default (e.g., Debian with kernel.unprivileged_userns_clone=0). On Ubuntu, it’s usually enabled. If you get a permission error, try with `sudo` for the examples, or check sysctl settings.

User Namespace (Very Important)

This allows unprivileged users to gain root inside the namespace.

Step 1: Create user namespace as non-root
unshare --user --map-root-user bash


Now check:

whoami


Output:

root


But you are not real root on host.

Check capabilities:

id


UID will be 0 inside namespace.

What --map-root-user does

It maps:

your_host_uid → 0 inside namespace


Check mapping:

cat /proc/self/uid_map


Example output:

0 1000 1


Means:

container UID 0 → host UID 1000


This is how rootless containers work.


6️⃣ User Namespace + /proc/self/uid_map

When user namespaces are enabled:

/proc/self/uid_map
/proc/self/gid_map


These show how container UID 0 maps to host UID 100000+.

This is rootless containers magic.

5. User IDs (UID) and Group IDs (GID)

Linux manages permissions based on IDs.

    Root (UID 0): The all-powerful user.

    Capabilities: A more modern way Linux breaks down "root powers" into smaller pieces (like the ability to reboot or change the system clock).

    The Goal: Namespaces allow a user to be "root" inside a container (UID 0) while being a "nobody" (UID 1001) on the actual host machine.

## Why user namespaces are the root namespace

When you run `lsns --tree`, you’re seeing the **hierarchical nature of Linux namespaces**, but the "User Namespace" occupies a special spot at the top because of how the kernel manages privileges.

In short: **User namespaces are the foundation of the security model for all other namespaces.**

---

### 1. The "Ownership" Model

Every namespace (Mount, PID, Network, etc.) is **owned** by a specific user namespace. When a new namespace is created, the kernel records which user namespace was active at that moment and assigns it as the "parent" or owner.

Because a user namespace defines what a user is allowed to do (their capabilities), the kernel needs to know which user namespace to check when a process tries to perform a privileged action inside another namespace.

### 2. Capabilities and the Hierarchy

The reason the user namespace appears as the root is due to how **Capabilities** are scoped:

* **Root in a Child:** You can be "root" (UID 0) inside a child user namespace, which gives you full privileges over the resources *inside* that namespace (like its own mount points or network stack).
* **Safety for the Host:** However, your "root" status is restricted to that specific user namespace and its children. To the parent (the root user namespace), you are just a regular, unprivileged user.

### 3. Why they appear as "Children"

In `lsns --tree`, the visualization reflects this ownership. If you create a new Network namespace from within a specific User namespace:

1. The Network namespace is "born" into that User namespace.
2. The kernel enforces a rule: **To change anything in a non-user namespace, you must have the required capability in its owning user namespace.**

### Summary Table: Namespace Relationships

| Namespace Type | Role in the Tree | Purpose |
| --- | --- | --- |
| **User (CLONE_NEWUSER)** | **The Parent / Root** | Manages UIDs, GIDs, and Capabilities. |
| **Other (Network, PID, etc.)** | **The Children** | Managed resources that rely on the User NS for permission checks. |

> **Note:** Even if you don't explicitly create a new user namespace when spinning up a container, your namespaces are still technically "owned" by the initial user namespace of the entire system.

---

Would you like me to show you the specific command to see the **UID mappings** between your current user namespace and the root to see how the "translation" works?

# why docker as root is a concern and what rootless containers are
