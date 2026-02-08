---
sidebar_position: 1
---

# Images

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