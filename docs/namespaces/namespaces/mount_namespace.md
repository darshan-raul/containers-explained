---
sidebar_position: 4
---
import PivotRootDemo from '@site/src/components/PivotRootDemo';

# Mount Namespace and pivot_root

:::info trivia
Mount namespace was the first namespace to be introduced in Linux back in 2002!
:::

## Mount Namespace

We looked at this in the previous section, but heres the quick recap.

**A mount namespace allows a process to have its own independent view of the filesystem hierarchy.**


**Without it:**
- Every process on Linux shares one global mount table and hence shared view of all the files.

**With it:**
- A process can mount filesystems that others cannot see.
- It can have a completely different /.
- It can isolate /proc, /sys, /dev, etc.

When a new mount namespace is created (via `unshare` or `clone`), the new namespace receives a **copy** of the mount points from the parent namespace.

:::info Disclaimer
Multiple mount propagation types exist [shared, private, slave, unbindable]. Exploring their technical details is beyond the scope of this tutorial. 

However, it is important to note that the default propagation type is `shared` [If host mounts something → appears inside namespace and viceversa]. We will prefer `private` propagation for containers [No propagation in either direction] and see examples accordingly.
:::

Lets do a demo

```bash
unshare -m /bin/bash

mount --make-rprivate /

mount -t tmpfs isolated_fs /mnt

findmnt /mnt
```

on host machine

```bash

findmnt /mnt
# Result: Empty. The host does not see /mnt.
```

**Takeaway:** A container runtime effectively runs something similar to `mount --make-rprivate /` immediately after creating the namespace to prevent any other process seeing its mount.

---

## Pivot Root

### `chroot`: The Traditional Jailing Mechanism

The `chroot` command changes the apparent root directory for a process, confining it to a specific directory tree. It is commonly used for:

- **System Recovery**: Repairing unbootable systems (e.g., via live CD).
- **Build Environments**: Creating clean, isolated environments for compiling software.
- ChrootDirectory in ssh/sftp connections
- **Application Isolation**: Running services (like DNS/FTP) in "jails" to limit damage if compromised.

However, it is a **basic isolation mechanism**. Unlike modern containers using namespaces, `chroot` does not isolate resources like networking or process IDs, and can be escaped with sufficient privileges.

**Key Limitations:**

- **Escape routes:** A process with sufficient privileges can break out of a chroot jail




### `pivot_root`: The Container‑Grade Switch

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

### `pivot_root` Walkthrough

<PivotRootDemo />

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



Once the namespace is isolated, the container needs a new root filesystem (`/`). Naive implementations use `chroot`, but secure containers use `pivot_root`.

### A. The Limitations of `chroot`

`chroot` changes the root directory for the current process. However, it has significant flaws for security:

1.  **Does not unmount old root:** The old root filesystem is still mounted, just inaccessible via normal path traversal.
2.  **Escapes:** If a process inside the `chroot` has root privileges and capabilities, it can potentially break out (jailbreaking) using `mknod` to create device nodes accessing raw disk blocks, or by using `chroot` again if `cwd` is kept outside.
3.  **Namespace mismatch:** `chroot` does not interact cleanly with mount namespaces; it changes the filesystem view but leaves the old mounts vulnerable to unmounting attacks from inside.

### B. `pivot_root`: The Superior Mechanism

`pivot_root` is a system call that atomically moves the root mount to a new location and puts a new mount in its place.

The logic:
1.  The current root (`/`) is moved to `put_old`.
2.  The `new_root` becomes the new `/`.
3.  The process is effectively "locked" into the new filesystem tree.

After pivoting, the old root (the host filesystem) is mounted on a directory inside the new root (e.g., `/old_root`). We can then `umount` it, completely removing access to the host filesystem. This prevents the "jailbreak" scenarios inherent in `chroot`.

### C. Step-by-Step Manual Implementation

Let's build a mini-container manually.

**Prerequisites:**
*   A directory acting as the new root.
*   A minimal binary (e.g., BusyBox) inside that directory.

**Step 1: Prepare the Filesystem**
```bash
# Create a directory for the new root
$ mkdir -p /tmp/new_root

# Create the target structure
$ mkdir -p /tmp/new_root/{bin,old_root}

# Download or copy a static binary (Busybox is ideal)
# Assuming busybox is available or statically compiled
$ cp /bin/busybox /tmp/new_root/bin/
$ cd /tmp/new_root/bin
$ for prog in sh ls cat mount umount; do ln -s busybox $prog; done
```

**Step 2: Enter Namespace and Pivot**
We must enter a mount namespace first. We cannot pivot the root of the host system safely without breaking the host.

```bash
# Enter a new mount namespace
$ unshare -m

# Inside the new namespace:
# 1. Ensure the new root is a mount point (required for pivot_root)
# We bind mount the directory onto itself.
$ mount --bind /tmp/new_root /tmp/new_root

# 2. Isolate the namespace (prevent propagation back to host)
$ mount --make-rprivate /

# 3. Perform the Pivot
# Usage: pivot_root new_root put_old
# We move current '/' to 'new_root/old_root', and 'new_root' becomes '/'
$ pivot_root /tmp/new_root /tmp/new_root/old_root

# 4. Change directory to the new root
$ cd /

# 5. Verify we are inside the new minimal root
$ ls /
bin  old_root

$ ls /old_root
# You see the host filesystem here! We must unmount it.
```

**Step 3: Cleanup and Security**
```bash
# Unmount the host filesystem (now located at /old_root)
# -l (lazy) is often used, but standard umount works if nothing is open.
$ umount /old_root

# Verify the host is gone
$ ls /old_root
# Empty! The host filesystem is completely inaccessible now.
```

We have successfully created an isolated environment where the host filesystem is unmounted and unreachable, a feat `chroot` cannot securely guarantee.

---



### B. The `/proc` Filesystem

If you executed `ps aux` in our manual example above, it would likely error or show host processes. Why?

**The Problem:**
The `/proc` filesystem is an interface to kernel data structures. It exposes process information, memory maps, and kernel parameters. It is **virtual**; it doesn't exist on disk. When we changed root, we brought over an empty directory for `/proc` (or didn't have one at all).

If we don't mount a new `/proc`, tools trying to read process info will look at an empty directory or the host's proc mount (if it leaked).

**The Solution:**
We must mount a fresh `proc` instance inside the new namespace.

```bash
# Inside the isolated shell (after pivot_root)
$ mount -t proc proc /proc
```

**Interaction with PID Namespaces:**
Mounting `/proc` inside a mount namespace is only half the battle. The data inside `/proc` (e.g., `/proc/1`) reflects the PID namespace of the process viewing it.

If you create a mount namespace but **not** a PID namespace:
*   Mounting `/proc` shows the host's PIDs.
*   `ps aux` shows host processes.

To achieve true process isolation:
1.  Create **PID Namespace** (`unshare -p -m`).
2.  Fork the process (required to enter the new PID namespace).
3.  **Mount `/proc`** (because the new PID namespace is meaningless without the filesystem view to see it).

**Demonstration of Failure:**
```bash
# Create PID and Mount namespace
$ unshare -p -m --fork /bin/bash

# Attempt to use ps
$ ps aux
Error, do this: mount -t proc proc /proc

# Mount proc
$ mount -t proc proc /proc

# Now ps works and shows only our shell (PID 1) and ps itself
$ ps aux
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.0  12112  3456 pts/0    S    10:00   0:00 /bin/bash
root         2  0.0  0.0  12345  2345 pts/0    R+   10:01   0:00 ps aux
```

---

## V. Other Crucial Topics & The "Big Picture"

### A. Interaction with Other Namespaces

Container isolation is a mosaic. Mount namespaces are the canvas, but other namespaces paint the details:

1.  **PID Namespace:** Requires remounting `/proc` as described above. Without it, the container sees host process IDs.
2.  **User Namespace:** Allows mapping root (uid 0) inside the container to an unprivileged user (uid 100000) on the host. This interacts with mount namespaces because mounting filesystems usually requires root privileges. With User Namespaces, a "root" user inside the namespace is granted the capability to mount filesystems (specifically allowed by the kernel for certain filesystem types like `proc`, `tmpfs`, `sysfs`, and `bind` mounts) without being root on the host.
3.  **UTS Namespace:** Isolates the hostname. While not directly a filesystem mount, the hostname is often written to `/etc/hostname` inside the container's mount namespace so tools like `bash` read the correct identity.

### B. `/sys` and `/dev`

*   **`/sys`:** This exposes kernel objects. It is dangerous to expose the host's `/sys` to a container.
    *   **Strategy:** Containers usually mount a new `sysfs` or, more commonly in high-security runtimes, mount a `tmpfs` over `/sys` and create empty directories to mask it, or mount it Read-Only (`ro`) to prevent modification of kernel parameters.
*   **`/dev`:** This contains device nodes.
    *   **Strategy:** The host's `/dev` is *never* exposed (security risk).
    *   Containers create a fresh `devtmpfs` or a `tmpfs` at `/dev`. The container runtime then `mknod`s only specific safe devices (like `/dev/null`, `/dev/zero`, `/dev/tty`) and optionally passes through specific devices requested by the user (e.g., `/dev/video0`).

### C. Networking Configuration Injection

Containers need network access, but they live in a separate network namespace. How do they know the DNS servers?

The host's `/etc/resolv.conf` is managed by NetworkManager or systemd-resolved. The container has its own filesystem.

**The Pattern:**
The container runtime (Docker/Podman) creates a specific `/etc/resolv.conf` file on the host (often in a directory like `/var/lib/docker/containers/<ID>/`).
It then **bind mounts** this file into the container's mount namespace at `/etc/resolv.conf`.

```bash
# Conceptually what Docker does
$ mount --bind /var/lib/docker/containers/ID/resolv.conf /tmp/new_root/etc/resolv.conf
```
This allows the host to update DNS settings dynamically, and the container sees the update instantly, without needing to modify the container image layer.

---

## VI. Conclusion: The Big Picture

When you type `docker run -it alpine sh`, the following low-level mechanics occur:

1.  **Namespace Creation:** The runtime clones the process with `CLONE_NEWNS` (Mount), `CLONE_NEWPID` (PID), `CLONE_NEWNET` (Network), etc.
2.  **Mount Propagation:** The runtime marks the new mount namespace as `MS_PRIVATE` or `MS_SLAVE` to isolate it from the host.
3.  **Filesystem Assembly:** An OverlayFS is mounted, merging the Alpine image layers with a writable layer.
4.  **Pivot Root:** The process `pivot_root`s into the OverlayFS mount. The old host root is unmounted and disappears.
5.  **Virtual FS Setup:**
    *   `proc` is mounted at `/proc` (enabling process listing in the PID NS).
    *   `sysfs` is mounted Read-Only or masked.
    *   `tmpfs` is mounted at `/dev` with essential devices created.
6.  **Configuration Injection:** Bind mounts for `/etc/resolv.conf` and `/etc/hosts` are established.

The result is a process that believes it is running on a dedicated Linux machine, completely unaware that its root filesystem is merely a stack of layers, and its `/dev` is a curated selection of devices. This is the power of Mount Namespaces: the ability to construct a tailored reality for a process.
:::info
A container runtime effectively runs mount --make-rprivate / immediately after creating the namespace to prevent mount leakage.
:::



