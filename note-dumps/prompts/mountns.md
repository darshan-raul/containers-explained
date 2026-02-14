
Act as a Linux internals expert and technical educator. I need you to create a comprehensive, in-depth technical guide and detailed outline regarding Linux Mount Namespaces.

The guide must be structured for an intermediate-to-advanced Linux user (familiar with the command line and basic container concepts) who wants to understand the kernel mechanics behind container filesystem isolation.

**Core Requirements for the Guide:**

1.  **Detailed Outline:** Start by providing a hierarchical outline of the entire tutorial so the reader understands the flow before the deep dive begins.

2.  **Fundamentals of Mount Namespaces:**
    - Explain what a mount namespace is and how it isolates mount points.
    - Clarify the concept of "mount propagation" and the crucial difference between **shared**, **private**, **slave**, and **unbindable** mounts. Explain why this matters when creating new namespaces.
    - Provide practical CLI examples using `unshare` and `nsenter` to demonstrate creating a new mount namespace and observing that mounts in the host are not visible inside the new namespace (and vice-versa, depending on propagation types).

3.  **Deep Dive: `pivot_root` vs. `chroot`:**
    - Dedicate a significant section to `pivot_root`.
    - Explain the system call: what it does to the filesystem namespace, why it is superior to `chroot` for containers (specifically regarding security and stability), and the concept of putting the old root filesystem to a mount point that is then made private/unreachable.
    - Provide a step-by-step, low-level example (shell commands) of manually setting up a new root filesystem (e.g., using a simple directory with a minimal busybox binary) and using `pivot_root` to switch into it. Explain each command's purpose ( creating directories, moving the old root).

4.  **Container Filesystem View:**
    - Explain how containers achieve a "completely different filesystem view." Cover the combination of `pivot_root` (or `chroot` in some legacy cases) and mount namespaces.
    - Describe the role of layered filesystems (like OverlayFS) in this context—how a container image layers are mounted to create a combined rootfs before `pivot_root` is invoked.

5.  **The `/proc` Filesystem:**
    - Dedicate a section to `proc`. Explain why a container needs its own `/proc` mount.
    - Demonstrate what happens if you don't mount a new `/proc`: show how `ps aux` or accessing `/proc/self` reflects the host's processes, breaking isolation.
    - Explain the mechanics: mounting the `proc` filesystem inside the new mount namespace provides a process information view specific to that PID namespace (tying in PID namespaces as a necessary co-concept).

6.  **Other Crucial Topics & The "Big Picture":**
    - **Interaction with other namespaces:** Explicitly explain how mount namespaces interact with PID namespaces (for `/proc`), User namespaces (for privilege), and UTS namespaces to build a complete container.
    - **`/sys` and `/dev`:** Briefly touch on how a container handles these virtual filesystems (e.g., `sysfs` is typically mounted read-only, `devtmpfs` or a minimal `/dev` is provided).
    - **`/etc/resolv.conf` and `/etc/hosts`:** Explain the common pattern of mounting these files as bind-mounts from the host to provide network configuration inside the isolated mount namespace.

**Formatting and Depth:**
- Use clear headings and subheadings.
- Include code blocks for all shell commands.
- Explain the "why" behind every command, not just the "what."
- Conclude by tying all the concepts together to explain how a tool like Docker or Podman leverages these kernel features to give a container its isolated filesystem environment.

**Start your response now with the detailed outline, followed by the full tutorial.**