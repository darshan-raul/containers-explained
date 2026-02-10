---
sidebar_position: 4
---
# User Namespaces

> Run as "root", not root

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
