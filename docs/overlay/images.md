---
sidebar_position: 1
---

# Images


## IV. Container Filesystem View

### A. Layered Filesystems (OverlayFS)

In the previous example, we used a plain directory. Real containers use **OverlayFS**. This allows multiple layers (read-only image layers + a writable container layer) to be merged into a single view.

Before the `pivot_root` step occurs, a container runtime performs:

1.  **Mount Layers:** It mounts the OverlayFS.
    *   `lowerdir`: The read-only image layers.
    *   `upperdir`: The writable container layer.
    *   `workdir`: Required by OverlayFS.
2.  **Result:** A merged directory appears at a mount point (e.g., `/var/lib/containerd/.../merged`).
3.  **Pivot:** The runtime `pivot_root`s into this merged directory.

This is why containers feel lightweight; they share the read-only image layers on disk but appear to have a full independent filesystem.

Nice catch — and you’re absolutely right to call that out 👍
This is one of those **“Docker storage paths depend on how Docker was installed”** gotchas.

Let’s fix it **precisely**, using *current Docker Engine behavior*.

---

## Why `/var/lib/docker/containerd` does NOT exist on your system

Modern Docker can run in **two modes**:

### 🔹 Mode A — *Docker-managed containerd* (older / some distros)

```
/var/lib/docker/containerd/...
```

### 🔹 Mode B — *System containerd (MOST COMMON TODAY)* ✅

```
/var/lib/containerd/...
```

👉 On most modern installs (Docker 24/25 on Ubuntu, RHEL, Rocky, etc.),
**containerd is a separate system service**, so Docker does **not** store blobs under `/var/lib/docker/containerd`.

That’s why the directory is missing — nothing is broken.

---

## The REAL place your image layers live (on your system)

Your nginx layers are here 👇

```bash
/var/lib/containerd/io.containerd.content.v1.content/blobs/sha256/
```

This is **containerd’s global content store**.

---

## 🔍 Step 1: confirm what Docker is using

Run:

```bash
docker info | grep -i containerd
```

You’ll see something like:

```
containerd version: 1.7.x
containerd runc version: runc 1.1.x
```

Now check containerd directly:

```bash
containerd config dump | grep root
```

Typical output:

```
root = "/var/lib/containerd"
```

✅ That’s the smoking gun.

---

## 🔍 Step 2: find your nginx layer blob (for real this time)

Take one layer digest from your inspect output:

```
sha256:989e799e634906e94dc9a5ee2ee26fc92ad260522990f26e707861a5f52bf64e
```

Now:

```bash
ls -lh /var/lib/containerd/io.containerd.content.v1.content/blobs/sha256/989e799e634906e94dc9a5ee2ee26fc92ad260522990f26e707861a5f52bf64e
```

You should see a **regular file**, not a directory.

That file **is the layer**.

---

## 🔍 Step 3: prove it’s a filesystem layer

```bash
cp /var/lib/containerd/io.containerd.content.v1.content/blobs/sha256/989e799e63* /tmp/layer.tar
file /tmp/layer.tar
```

Expected:

```
gzip compressed data
```

Extract it:

```bash
mkdir /tmp/layer
tar -xzf /tmp/layer.tar -C /tmp/layer
ls /tmp/layer
```

🎯 Those are the actual files added by that image layer.

---

## So where is `/var/lib/docker/overlay2` still used?

OverlayFS is **Docker’s snapshotter**, not image storage.

```
/var/lib/docker/
└── overlay2/
    ├── <container-id>/
    │   ├── diff/
    │   ├── lower
    │   ├── merged/
    │   └── work/
```

⚠️ These directories appear **ONLY after**:

```bash
docker create
docker run
```

They **do not exist** for images alone.

---

## 🔥 Prove it live (recommended lab)

```bash
docker create --name test-nginx nginx:alpine
```

Now:

```bash
ls /var/lib/docker/overlay2
```

Then map it:

```bash
docker inspect test-nginx | jq '.[0].GraphDriver.Data'
```

---

## One sentence that locks it in

> **Image layers live as compressed blobs in `/var/lib/containerd`.
> OverlayFS directories live in `/var/lib/docker/overlay2` and only exist for containers.**

---

## Extra sanity checks (advanced)

List containerd content:

```bash
ctr -n moby content ls | head
```

List snapshots:

```bash
ctr -n moby snapshots ls
```

You’re now looking at Docker **from the same angle Docker engineers do** 😄
If you want, next we can **trace one exact layer from `docker inspect` → blob → snapshot → merged mount**, end-to-end.

---

When using Docker with the **containerd image store**, "seeing" the internal details is distinct from the classic Docker method because the file structure is more opaque (random numbered directories instead of hashes).

Here is how you can inspect the **nginx:alpine** image internals in this setup.

### 1. The "Human-Friendly" Way: Mount the Image

The easiest way to see the *unpacked* contents of `nginx:alpine` without starting a container is to use the `ctr` tool to mount the image to a temporary folder. This lets you browse it like a regular directory.

**Step 1: Mount the image**
You likely need to use the `moby` namespace (used by Docker) or `default` (if using standalone containerd).

```bash
# Create a temp directory
mkdir /tmp/nginx-root

# Mount the image (read-only)
# Note: Ensure you use the full image name as it appears in 'docker images'
sudo ctr -n moby image mount docker.io/library/nginx:alpine /tmp/nginx-root

```

*(If `-n moby` doesn't find the image, try `-n default`)*

**Step 2: Explore**
Now you can browse the file system exactly as it appears to the container:

```bash
ls -F /tmp/nginx-root/etc/nginx/
cat /tmp/nginx-root/etc/os-release

```

**Step 3: Clean up**

```bash
sudo umount /tmp/nginx-root

```

---

### 2. The "Forensic" Way: Find the Real Files on Disk

If you want to find where the files physically reside on your hard drive (inside `/var/lib/containerd`), follow this path.

**The Challenge:**
Unlike classic Docker, which names folders after image hashes (e.g., `/overlay2/abc123...`), containerd assigns **random integer IDs** to unpacked layers (e.g., `/snapshots/45/fs`). You cannot guess which folder is nginx just by looking at the names.

**Step 1: Find the Snapshot Key**
You need to find the "Chain ID" of the image's top layer. The easiest hack to find the path without doing math on layer hashes is to use `ctr snapshot mounts`.

List the snapshots and look for the one associated with your image (often the most recently created if you just pulled it):

```bash
sudo ctr -n moby snapshot ls

```

*The output keys will be long sha256 strings (Chain IDs).*

**Step 2: Get the Disk Path**
Once you have a snapshot Key (let's say it's `sha256:1234abcd...`), ask containerd where it is mounted:

```bash
sudo ctr -n moby snapshot mounts sha256:1234abcd...

```

**Step 3: Interpret the Output**
You will see output like this:

```bash
type=overlay options=[lowerdir=/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/15/fs:...]

```

The **`lowerdir`** path is the "Gold Mine."

* **Path:** `/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/15/fs`
* **What's inside:** The uncompressed files for that layer.

### 3. Summary of Locations

| Component | Location on Disk |
| --- | --- |
| **Compressed Layers (Blobs)** | `/var/lib/containerd/io.containerd.content.v1.content/blobs/sha256/`
 *(These are the tar.gzip files downloaded from the registry)* |
| **Unpacked Files (Snapshots)** | `/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/<ID>/fs/`
 *(These are the actual readable files)* |
| **Metadata DB** | `/var/lib/containerd/io.containerd.metadata.v1.bolt/meta.db`
 *(Binary database that maps Image Name -> Snapshot ID)* |

**Pro Tip:** If you use the command line tool `nerdctl` (a Docker-compatible CLI for containerd), it has a much friendlier `nerdctl image inspect` command that often reveals these details more clearly than raw `ctr`.