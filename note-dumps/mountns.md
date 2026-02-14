## Linux Mount Namespaces: A Deep Dive into Container Filesystem Isolation

### Detailed Outline

1.  **Introduction**
    - The role of namespaces in containerization
    - Focus: Mount namespaces and filesystem isolation

2.  **Fundamentals of Mount Namespaces**
    - 2.1 What is a Mount Namespace?
        - Isolating mount point lists
        - Per-namespace mount tables
    - 2.2 Mount Propagation Types
        - The `shared`, `private`, `slave`, `unbindable` flags
        - Why propagation matters when creating new namespaces
        - Viewing and changing propagation with `findmnt` and `mount --make-*`
    - 2.3 Practical Examples with `unshare` and `nsenter`
        - Creating a new mount namespace and verifying isolation
        - Observing propagation behaviour
        - Re-entering an existing namespace

3.  **Deep Dive: `pivot_root` vs. `chroot`**
    - 3.1 `chroot`: The Traditional Jailing Mechanism
        - How `chroot` works
        - Limitations: escape routes, shared mounts, and /proc leaks
    - 3.2 `pivot_root`: The Container‑Grade Switch
        - System call semantics: moving the old root out of the way
        - Why `pivot_root` is more secure and robust
        - Prerequisites: mount namespace, private mounts
    - 3.3 Manual `pivot_root` Walkthrough
        - Preparing a minimal root filesystem (busybox)
        - Creating a new mount namespace with `unshare`
        - Mounting a temporary `tmpfs` and setting up the new root
        - Performing `pivot_root` and cleaning up the old root
        - Switching into the new environment

4.  **Container Filesystem View**
    - 4.1 Combining Mount Namespace and `pivot_root`
        - Achieving a completely isolated filesystem hierarchy
    - 4.2 Layered Filesystems: OverlayFS
        - How container images use layers (lowerdir, upperdir, workdir)
        - Mounting an overlay as the container’s root
        - The role of mount namespaces in presenting the merged view

5.  **The `/proc` Filesystem**
    - 5.1 Why a Container Needs Its Own `/proc`
        - `/proc` exposes kernel and process information
        - Without isolation, a container sees host processes
    - 5.2 Demonstration: The Danger of a Shared `/proc`
        - Showing host processes inside a container that lacks a private `/proc`
    - 5.3 Mounting a Private `/proc`
        - The `proc` filesystem type and its relationship to PID namespaces
        - Step‑by‑step: mounting `/proc` inside the new mount namespace
        - Verifying isolation with `ps`

6.  **Other Crucial Topics & The Big Picture**
    - 6.1 Interaction with Other Namespaces
        - **PID namespaces:** Essential for `/proc` to show only container processes
        - **User namespaces:** Mapping root privileges for unprivileged container setup
        - **UTS namespaces:** Isolating hostname and domainname
    - 6.2 Handling `/sys` and `/dev`
        - Mounting `sysfs` (typically read‑only) inside the container
        - Providing a minimal `/dev` with `devtmpfs` or a custom device tree
    - 6.3 Bind‑Mounting Configuration Files
        - `/etc/resolv.conf`, `/etc/hosts`, `/etc/hostname`
        - How container runtimes inject host networking configuration via bind mounts
    - 6.4 Putting It All Together: Docker/Podman Internals
        - How a container runtime orchestrates namespaces, `pivot_root`, overlays, and mounts

7.  **Conclusion**
    - Recap of key concepts
    - The elegance of mount namespaces in enabling container filesystem isolation

---

## Full Tutorial

### 1. Introduction

Linux containers (like Docker, Podman, LXC) provide lightweight virtualization by leveraging kernel namespaces and control groups (cgroups). Among the various namespaces, **mount namespaces** are fundamental to giving each container its own isolated view of the filesystem hierarchy. Without mount namespaces, all processes on a host would share the same set of mounted filesystems – a situation that would make true containerization impossible.

In this guide, we’ll dive deep into mount namespaces, explore how they interact with other kernel features, and ultimately understand how tools like Docker construct a completely separate filesystem environment for a container.

### 2. Fundamentals of Mount Namespaces

#### 2.1 What is a Mount Namespace?

A mount namespace is a Linux kernel feature that isolates the list of mount points seen by processes in that namespace. Each mount namespace has its own **mount table** – a copy of the mount information from its parent namespace at the moment of creation. After creation, mounts and unmounts performed inside a namespace are only visible to processes within that namespace (and its descendants, depending on propagation settings).

In essence, a process can have its own private set of mounted filesystems, completely separate from the host.

#### 2.2 Mount Propagation Types

When a new mount namespace is created, the mount points from the original namespace are **copied** into the new one. However, the relationship between the two copies is governed by **mount propagation flags**. These flags determine how mount events (mount, unmount) are propagated between namespaces. The four propagation types are:

- **shared** – Mount and unmount events are propagated both to and from a shared mount. If a mount is marked shared, any mount performed on it will be reflected in all other shared copies of that mount (in any namespace). Similarly, unmounts are propagated.
- **private** – No events are propagated. A private mount is completely independent.
- **slave** – A slave mount receives propagation events from its master (a shared mount) but does not send events back. Changes made on the slave side do not affect the master.
- **unbindable** – Same as private, but also cannot be used as the source for a bind mount. This is useful for mounts like `/proc` inside containers that should never be bind‑mounted elsewhere.

**Why propagation matters when creating new namespaces:**  
When you create a new mount namespace (e.g., with `unshare(CLONE_NEWNS)`), all mounts from the original namespace are copied into the new one, **but they retain their original propagation flags**. If the original mounts are shared, then mounts and unmounts in one namespace will affect the other – which is often not desired for containers. Therefore, container runtimes typically remount the root filesystem as **private** or **slave** before creating the new namespace to ensure proper isolation.

You can examine propagation flags with `findmnt -o TARGET,PROPAGATION` and change them using `mount --make-<type>`. For example:
```bash
# Make / private
mount --make-private /
# Make / shared
mount --make-shared /
```

#### 2.3 Practical Examples with `unshare` and `nsenter`

Let’s get our hands dirty. We’ll use `unshare` to create a new mount namespace and observe isolation.

**Example 1: Basic isolation**
```bash
# In a terminal, create a temporary mount point
sudo mkdir /tmp/myns
sudo mount -t tmpfs tmpfs /tmp/myns

# Now start a bash shell in a new mount namespace
sudo unshare -m bash

# Inside the new namespace, list mounts
mount | grep /tmp/myns   # Should still see it (it was copied)
# But if we unmount it here:
sudo umount /tmp/myns
mount | grep /tmp/myns   # Now gone

# In another terminal (host), check:
mount | grep /tmp/myns   # Still present! Isolation works.
exit   # leave namespace
```

**Example 2: Propagation behaviour**
```bash
# First, check the propagation of /
findmnt / -o PROPAGATION   # likely "shared"

# Now create a new namespace with unshare, but this time we'll see how a new mount in the host affects it.
sudo unshare -m bash
# Inside namespace, make a test directory
mkdir /tmp/test
# Now, from the host, mount something on that directory
# (in another terminal)
sudo mount -t tmpfs tmpfs /tmp/test
# Inside the namespace:
ls /tmp/test   # You'll see it's empty? Wait, maybe it's there? 
# Actually, because / is shared by default, the mount in host should propagate into the namespace.
# But many systems now default to "shared" for root, so it will propagate.
# Let's verify: inside namespace, run mount | grep /tmp/test   # Should see the tmpfs mount.
# That's propagation. To prevent this, we would make / private before creating the namespace.
```

To demonstrate the effect of propagation flags, we can change them:

```bash
# In host, make / private
sudo mount --make-private /
# Now create new namespace
sudo unshare -m bash
# In host, mount something on /tmp/test again
# (in another terminal)
sudo mount -t tmpfs tmpfs /tmp/test
# Inside namespace, check mount | grep /tmp/test   # Nothing! No propagation.
```

**Re‑entering a namespace with `nsenter`:**  
If a process is already in a mount namespace, you can join it with `nsenter`:
```bash
# Find a process in the namespace (e.g., PID of the bash from earlier)
# Then:
sudo nsenter -t <PID> -m bash
```
This is useful for debugging.

### 3. Deep Dive: `pivot_root` vs. `chroot`

#### 3.1 `chroot`: The Traditional Jailing Mechanism

The `chroot` system call changes the root directory for a process and its children to a specified location. It’s the oldest form of filesystem isolation. However, it has several limitations:

- **Escape routes:** A process with sufficient privileges can break out of a chroot jail (e.g., by creating a directory and using `chroot` again, or by using `fchdir` techniques).
- **Shared mounts:** Even inside a chroot, the process still shares the global mount namespace. If the host mounts a new filesystem, it becomes visible inside the chroot (unless you also create a mount namespace).
- **`/proc` leaks:** If `/proc` is mounted inside the chroot, it reflects the host’s process list, breaking isolation.
- **File descriptor leaks:** Open file descriptors pointing outside the chroot can be used to escape.

Despite these issues, `chroot` is still used occasionally (e.g., in some build systems) but is not sufficient for secure container isolation.

#### 3.2 `pivot_root`: The Container‑Grade Switch

`pivot_root` moves the root filesystem of the current process to a directory `put_old` and makes `new_root` the new root filesystem. The calling process must be in a mount namespace, and the `new_root` must be a mount point. After the call, the old root is accessible at `put_old`, and the process can later unmount it to completely hide it.

**Why `pivot_root` is superior:**
- It changes the root **filesystem** for the entire mount namespace, not just the process’s view. Combined with a mount namespace, it creates a truly isolated environment.
- The old root is moved to a location that can be made private and then unmounted, removing any path to escape.
- It prevents accidental access to host files because the old root is no longer reachable after unmounting.
- It works hand‑in‑hand with mount namespaces and propagation flags.

The typical steps to use `pivot_root` for a container:
1. Create a new mount namespace.
2. Ensure the new root directory (e.g., the container’s root filesystem) is a mount point.
3. Make the current root (`/`) a private mount to avoid propagation issues.
4. Call `pivot_root(".", "put_old")` (from within the new root directory).
5. `chdir("/")` to ensure we’re in the new root.
6. Unmount `put_old` (the old root) to hide it.
7. Optionally, mount `/proc`, `/sys`, etc.

#### 3.3 Manual `pivot_root` Walkthrough

Let’s simulate what a container runtime does. We’ll create a minimal root filesystem with busybox and use `pivot_root` to switch into it.

**Prerequisites:**
- You need a directory with a minimal root. We’ll create one under `/tmp/newroot`.
- You’ll need `busybox` binary (static) – you can download it or copy from `/bin/busybox` if it’s dynamically linked, but for simplicity, we’ll use a static one.

**Step 1: Prepare a minimal root**
```bash
# Create directories
sudo mkdir -p /tmp/newroot/{bin,proc,sys,dev,oldroot}
# Copy a static busybox
sudo cp /bin/busybox /tmp/newroot/bin/
# Create symlinks for busybox applets
for applet in sh ls mount umount ps; do
    sudo ln -s /bin/busybox /tmp/newroot/bin/$applet
done
```

**Step 2: Create a new mount namespace and make root private**
We’ll use `unshare` to launch a shell in a new mount namespace. Inside that shell, we’ll first make `/` private to prevent propagation.
```bash
sudo unshare -m bash
# Inside the namespace:
mount --make-private /
```

**Step 3: Mount the new root as a bind mount or tmpfs**
`pivot_root` requires that `new_root` is a mount point. So we’ll bind-mount `/tmp/newroot` onto itself to make it a mount point.
```bash
mount --bind /tmp/newroot /tmp/newroot
```

**Step 4: Perform `pivot_root`**
Now we change directory into `/tmp/newroot` and call `pivot_root`.
```bash
cd /tmp/newroot
# The old root will be moved to oldroot inside newroot
pivot_root . oldroot
```
If successful, the current root filesystem becomes `/tmp/newroot`, and the old root is now at `oldroot`.

**Step 5: Adjust environment and clean up**
We need to ensure we’re in the new root and unmount the old root.
```bash
# Change to the new root (though we are already there)
cd /
# Unmount the old root (it's now at /oldroot)
umount -l /oldroot   # lazy unmount to detach it
# Optionally remove the empty directory
rmdir /oldroot
```

**Step 6: Verify isolation**
Now we have a shell running with its own root. Let’s see:
```bash
ls /
# Should see bin, proc, sys, dev – not the host’s root.
mount   # Shows only mounts inside this namespace (e.g., the bind mount of /tmp/newroot)
ps aux  # Will fail because /proc is not mounted – we’ll fix that later.
```

To exit the container, just `exit`. You’ll return to the host shell, and the namespace will be destroyed.

**Why this works for containers:** The process now has its own root, and the old root is unmounted, so it cannot access host files. Combined with a mount namespace, no mount events from the host leak in.

### 4. Container Filesystem View

#### 4.1 Combining Mount Namespace and `pivot_root`

In a container runtime, the sequence is typically:
- The runtime creates a new mount namespace (and other namespaces).
- It mounts the container’s root filesystem (often an overlay) at some location, e.g., `/var/lib/docker/overlay2/<id>/merged`.
- It makes that mount point private (or slave) to isolate it.
- It calls `pivot_root` to switch the root to that mount point.
- Finally, it unmounts the old root.

This gives the container a completely different filesystem view, independent of the host.

#### 4.2 Layered Filesystems: OverlayFS

Container images are composed of layers. For example, a Docker image might have a base layer (Ubuntu) and several application layers. When starting a container, the runtime uses OverlayFS (or another union filesystem) to combine these layers into a single coherent root.

OverlayFS mounts have:
- `lowerdir`: one or more read‑only layers (the image layers).
- `upperdir`: a writable layer for changes made in the container.
- `workdir`: a temporary directory for OverlayFS internal use.

The runtime mounts the overlay at a location (e.g., `/var/lib/docker/overlay2/<id>/merged`) and then uses that mount point as the `new_root` for `pivot_root`.

Example overlay mount:
```bash
mount -t overlay overlay \
  -o lowerdir=/var/lib/docker/overlay2/layer1:/var/lib/docker/overlay2/layer2,\
upperdir=/var/lib/docker/overlay2/container-diff,\
workdir=/var/lib/docker/overlay2/work \
  /var/lib/docker/overlay2/merged
```

The mount namespace ensures that this overlay mount is only visible inside the container. Other processes on the host see nothing.

### 5. The `/proc` Filesystem

#### 5.1 Why a Container Needs Its Own `/proc`

`/proc` is a virtual filesystem that exposes kernel data structures, including process information. If a container shares the host’s `/proc`, then tools like `ps`, `top`, and `lsof` inside the container will show host processes, breaking isolation and potentially leaking sensitive information. Moreover, accessing `/proc/self` would refer to the process outside the container.

#### 5.2 Demonstration: The Danger of a Shared `/proc`

Let’s simulate a container without its own `/proc`. Using our earlier `pivot_root` example, we did not mount `/proc`. If we run `ps` inside that environment, we’d get an error because `/proc` doesn’t exist. But suppose we bind‑mounted the host’s `/proc` into the container (which would be a terrible idea):
```bash
# Inside the container namespace, if we did:
mount --bind /proc /proc   # but /proc on host is still the host's proc
# Then running ps would show host processes.
```

To see this clearly, we can use a simple test:
```bash
# Start a new mount namespace
sudo unshare -m bash
# Bind-mount host's /proc somewhere inside
mkdir /tmp/myproc
mount --bind /proc /tmp/myproc
# Now look at /tmp/myproc – it shows host processes.
ls /tmp/myproc | head
```

#### 5.3 Mounting a Private `/proc`

The correct way is to mount a new instance of the `proc` filesystem inside the container’s mount namespace. However, there’s a crucial dependency: **the `proc` filesystem presents processes based on the PID namespace**. To have a `/proc` that only shows the container’s processes, the container must also be in its own PID namespace.

In a combined setup:
- Create a new PID namespace (with `unshare -p`).
- Create a new mount namespace (with `unshare -m`).
- Inside the new namespaces, mount `proc`:
  ```bash
  mount -t proc proc /proc
  ```
Now `ps aux` will only show processes within that PID namespace (typically just the init process and its children).

Example:
```bash
# Start a new PID and mount namespace
sudo unshare -p -m bash
# In the new namespace, mount proc
mount -t proc proc /proc
ps aux
# You'll see only a few processes (e.g., bash, ps)
```

Without a PID namespace, the `proc` mount would still show host processes because the kernel uses the global PID namespace. So for proper isolation, containers always use both mount and PID namespaces together.

### 6. Other Crucial Topics & The Big Picture

#### 6.1 Interaction with Other Namespaces

To build a complete container, multiple namespaces are combined:

- **Mount namespace** – isolates filesystem mounts.
- **PID namespace** – isolates process IDs; necessary for a private `/proc`.
- **User namespace** – maps user and group IDs, allowing unprivileged users to have root privileges inside the container without having them on the host. This is critical for safely running containers as non‑root.
- **UTS namespace** – isolates hostname and domain name.
- **IPC namespace** – isolates System V IPC and POSIX message queues.
- **Network namespace** – isolates network interfaces, routing tables, etc.

For filesystem isolation, the combination of mount and user namespaces is especially important. With user namespaces, an unprivileged user can create a mount namespace and perform mounts that would otherwise require root privileges, because those mounts are confined to the namespace and the user’s mapped UID acts as root inside.

#### 6.2 Handling `/sys` and `/dev`

- **`/sys`**: The `sysfs` filesystem exposes kernel objects. In a container, `/sys` is typically mounted read‑only to prevent the container from modifying kernel parameters. Some containers may need specific parts of `/sys` writable (e.g., for certain device access), but that’s usually handled with finer‑grained control (like cgroups v2). Mount command: `mount -t sysfs -o ro sysfs /sys`.

- **`/dev`**: The device filesystem. Containers usually get a minimal `/dev` populated with standard devices (`/dev/null`, `/dev/zero`, `/dev/random`, etc.). This can be achieved by mounting `devtmpfs` (which the kernel automatically populates with devices) or by creating a custom set of device nodes. Most container runtimes use `devtmpfs` with the `-o nosuid,noexec,relatime` options and may also bind‑mount specific devices from the host (like `/dev/fuse` for FUSE filesystems).

Example:
```bash
mount -t devtmpfs devtmpfs /dev
```

#### 6.3 Bind‑Mounting Configuration Files

Containers often need network configuration: DNS servers, hostname, and static host entries. These are typically provided by bind‑mounting files from the host into the container’s filesystem:

- **`/etc/resolv.conf`**: The container runtime writes a `resolv.conf` with the host’s DNS settings and bind‑mounts it into the container.
- **`/etc/hosts`**: Similarly, a minimal hosts file (containing at least `127.0.0.1 localhost`) is provided.
- **`/etc/hostname`**: Sometimes bind‑mounted to set the container’s hostname.

Because these are bind mounts, any changes the container makes to these files will be reflected on the host – but typically they are mounted read‑only to prevent that.

Example:
```bash
# On host, prepare a resolv.conf for the container
echo "nameserver 8.8.8.8" > /tmp/container-resolv.conf
# Inside the container namespace (after pivot_root), bind mount it
mount --bind /tmp/container-resolv.conf /etc/resolv.conf
```

#### 6.4 Putting It All Together: Docker/Podman Internals

A container runtime (like `runc`, the low‑level tool used by Docker) orchestrates the following steps to create a container with an isolated filesystem:

1. **Create a bundle**: The runtime unpacks the container image layers, sets up an overlay mount at a temporary location (e.g., `/run/containerd/io.containerd.runtime.v2.task/moby/<id>/rootfs`).
2. **Create namespaces**: It calls `unshare` (or the `clone` system call) to create new namespaces: mount, PID, user, UTS, IPC, network. It sets up the user namespace mapping so that UID 0 inside maps to an unprivileged UID on the host.
3. **Prepare mounts**: Inside the new mount namespace (but before `pivot_root`), it mounts `/proc`, `/sys`, `/dev`, and bind‑mounts configuration files.
4. **Switch root**: It uses `pivot_root` to make the overlay root the new root, then unmounts the old root.
5. **Exec the container process**: Finally, it `exec`s the container’s entrypoint (e.g., `/bin/sh`).

All these steps happen in the context of the new namespaces, ensuring the process sees only its isolated view of the system.

### 7. Conclusion

Mount namespaces are a cornerstone of Linux container technology. They provide the ability to give each container its own private view of the mounted filesystems, which is essential for both security and operational independence. By combining mount namespaces with `pivot_root`, layered filesystems like OverlayFS, and other namespaces (especially PID and user), container runtimes create robust, lightweight environments that behave like separate machines.

Understanding mount namespaces at this level not only demystifies container internals but also empowers you to debug container filesystem issues, build custom container runtimes, and appreciate the elegance of Linux kernel design.

Now go forth and `unshare` with confidence!