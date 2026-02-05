# 🧭 INTRO — Orientation Deck

### What This Tutorial Is

* Deep dive into **Linux containers from first principles**
* No magic, no abstraction leaps
* Kernel → Primitives → Composition → Runtime

### What This Tutorial Is NOT

* Not a Docker usage guide
* Not Kubernetes-first
* Not platform marketing

### Why Internals Matter

* Debugging broken containers
* Security hardening
* Performance tuning
* Understanding cloud abstractions
* Becoming runtime-agnostic

### Prerequisites

* Linux basics
* Bash
* Processes & signals
* Filesystems

### Mental Model Preview

> Containers = Namespaces + Cgroups + Filesystems + Capabilities + Seccomp + Networking + Glue

### Roadmap / Index

(List of all major sections)

---

# 🧱 SILOS — Isolation (Who You Are, What You See)

> “A container is not a VM. It’s a constrained process.”

### 1. It’s Just a Process

* Run container → find PID on host
* `ps aux`
* `/proc/<pid>`
* Parent-child relationships

### 2. What Is a Namespace?

* Why namespaces exist
* Kernel-level illusion of isolation
* Types overview:

  * pid
  * net
  * mnt
  * uts
  * ipc
  * user
  * cgroup

### 3. Deep Dive Per Namespace

#### PID Namespace

* Init process concept
* PID 1 responsibilities

#### Mount Namespace

* Different root view

#### UTS Namespace

* Hostname isolation

#### IPC Namespace

* Shared memory, semaphores

#### User Namespace

* UID mapping

#### Network Namespace

* Separate network stack

### 4. Practice: Creating Your Own Namespaces

Using:

```
unshare
clone
nsenter
```

#### PID Namespace Lab

* One visible process

#### Mount Namespace Lab

* New rootfs

#### Network Namespace Lab

* Only loopback

#### User Namespace Lab

* UID remapping

### 5. Namespace Persistence

* What happens when process exits?
* Who owns the namespace?
* Namespace lifetimes

---

# 📦 BOX — Resource Control (How Much You Get)

> Cgroups answer: “How much?”

### 1. Why Cgroups Exist

* CPU hog problem
* Memory starvation
* Fork bombs

### 2. Cgroups v1 vs v2

* Hierarchy
* Controllers

### 3. Controllers

#### CPU

* Shares
* Quota

#### Memory

* Hard limit
* Soft limit
* OOM killer

#### PIDs

* Max processes

#### IO

* Throttling

### 4. Hands-On Cgroups

* Create cgroup manually
* Attach process
* Observe limits

### 5. How Containers Use Cgroups

* Per-container hierarchy
* How runtime places processes

### 6. Cgroups + Namespaces Together

* Why both are needed

---

# 🧬 GLUE — Filesystems (What You Touch)

> A container is a filesystem illusion.

### 1. Image vs Container

* Immutable image layers
* Writable container layer

### 2. Union Filesystems

* What union mount means

### 3. OverlayFS Internals

* lowerdir
* upperdir
* workdir
* merged

### 4. Copy-on-Write

* When it triggers
* Cost

### 5. Whiteouts

* How deletes work

### 6. Hands-On Overlay

* Build lower/upper dirs
* Mount manually

### 7. Root Filesystem Assembly

* BusyBox rootfs
* Chroot vs Pivot_root

### 8. Image Layer Storage Layout

* Where Docker stores layers
* Diff directories

---

# 🧍 INSIDE MAN — Runtime Internals

> Who actually builds the container?

### 1. High-Level Flow

```
docker → containerd → runc → kernel
```

### 2. OCI Specification

* runtime-spec
* image-spec

### 3. containerd

* What it manages
* Shim

### 4. runc

* Creates namespaces
* Applies cgroups
* Execs process

### 5. OCI Bundle Layout

* config.json
* rootfs/

### 6. Explore a Live Container

* Find runc PID
* Find namespaces
* Inspect config.json

### 7. Entering Namespaces

* nsenter
* Compare views

### 8. Strace a Container Creation

* Observe syscalls

---

# 🧠 NERVOUS SYSTEM — Networking

> Containers are isolated… but must communicate.

### 1. Network Namespace Refresher

### 2. veth Pairs

* Virtual cable

### 3. Linux Bridge

### 4. Container Networking Flow

```
container → veth → bridge → host → NIC
```

### 5. Hands-On Build

* Create netns
* Create veth
* Attach to bridge
* Assign IP

### 6. NAT & Masquerading

### 7. How Docker Sets This Up

* iptables chains
* nat table
* filter table

### 8. Kubernetes Pod Networking

* Pause container
* Shared netns
* CNI plugins

### 9. Service Networking (High Level)

* kube-proxy
* iptables vs IPVS

---

# 🛡️ IMMUNE SYSTEM — Security

> Why containers aren’t just “jails”.

### 1. Linux Capabilities

* Drop root powers

### 2. Seccomp

* Syscall filtering

### 3. AppArmor / SELinux

### 4. Read-Only Root FS

### 5. No-New-Privileges

### 6. User Namespace Security

---

# 🧾 BRAIN — Metadata & State

### 1. What Is Container State

* Running
* Paused
* Stopped

### 2. Where State Lives

* containerd metadata
* runtime state

### 3. Checkpoint / Restore (CRIU)

---

# 🔨 PRACTICAL — Build Your Own Container

> Final boss.

### Stage 1: Minimal RootFS

* BusyBox

### Stage 2: Chroot

### Stage 3: Pivot_root

### Stage 4: Namespaces

* PID
* Mount
* Net

### Stage 5: Cgroups

### Stage 6: OverlayFS

### Stage 7: Network Setup

### Stage 8: Drop Capabilities

### Stage 9: Run Process

### Result

```
./mini-container run /bin/sh
```

---

# 🔬 OBSERVABILITY LABS

* Inspect /proc
* Inspect /sys/fs/cgroup
* iptables-save
* mount
* lsns

---

# 🧨 FAILURE LABS

* Kill PID 1
* Exceed memory
* Break mount
* Remove veth

---

# 📚 APPENDIX

* Kernel references
* Man pages
* OCI docs
* Recommended books

------------

Perfect — let’s translate that conceptual structure into a **clean, scalable, git-friendly directory tree** that supports:

* Progressive learning
* Labs + explanations side by side
* Future expansion
* Easy navigation
* Static-site generators (MkDocs / Docusaurus / Hugo)

Below is a **battle-tested layout** you can drop straight into a repo.

---

# 📁 Root of Repository

```
containers-from-scratch/
├── README.md
├── mkdocs.yml                 # or docusaurus.config.js
├── docs/
├── labs/
├── diagrams/
├── scripts/
└── assets/
```

---

# 📁 docs/  (Theory + Guides)

```
docs/
├── 00-intro/
│   ├── 00-what-this-is.md
│   ├── 01-what-this-is-not.md
│   ├── 02-why-internals-matter.md
│   ├── 03-prerequisites.md
│   ├── 04-mental-model.md
│   └── 05-roadmap.md
│
├── 10-silos-isolation/
│   ├── 00-just-a-process.md
│   ├── 01-what-are-namespaces.md
│   ├── 02-pid-namespace.md
│   ├── 03-mount-namespace.md
│   ├── 04-uts-namespace.md
│   ├── 05-ipc-namespace.md
│   ├── 06-user-namespace.md
│   ├── 07-network-namespace.md
│   ├── 08-namespace-lifecycle.md
│   └── 09-summary.md
│
├── 20-box-cgroups/
│   ├── 00-why-cgroups.md
│   ├── 01-cgroups-v1-vs-v2.md
│   ├── 02-cpu-controller.md
│   ├── 03-memory-controller.md
│   ├── 04-pids-controller.md
│   ├── 05-io-controller.md
│   ├── 06-cgroups-and-containers.md
│   └── 07-summary.md
│
├── 30-glue-filesystems/
│   ├── 00-image-vs-container.md
│   ├── 01-union-filesystems.md
│   ├── 02-overlayfs-internals.md
│   ├── 03-copy-on-write.md
│   ├── 04-whiteouts.md
│   ├── 05-rootfs-assembly.md
│   ├── 06-image-storage-layout.md
│   └── 07-summary.md
│
├── 40-inside-man-runtime/
│   ├── 00-big-picture.md
│   ├── 01-oci-spec.md
│   ├── 02-containerd.md
│   ├── 03-runc.md
│   ├── 04-oci-bundle.md
│   ├── 05-exploring-live-container.md
│   ├── 06-entering-namespaces.md
│   ├── 07-strace-container-create.md
│   └── 08-summary.md
│
├── 50-nervous-system-networking/
│   ├── 00-network-namespace.md
│   ├── 01-veth-pairs.md
│   ├── 02-linux-bridge.md
│   ├── 03-container-network-flow.md
│   ├── 04-nat-masquerade.md
│   ├── 05-docker-networking.md
│   ├── 06-kubernetes-pod-networking.md
│   ├── 07-services-iptables-vs-ipvs.md
│   └── 08-summary.md
│
├── 60-immune-system-security/
│   ├── 00-linux-capabilities.md
│   ├── 01-seccomp.md
│   ├── 02-apparmor-selinux.md
│   ├── 03-readonly-rootfs.md
│   ├── 04-no-new-privileges.md
│   └── 05-summary.md
│
├── 70-brain-state/
│   ├── 00-container-state.md
│   ├── 01-metadata-storage.md
│   ├── 02-criu.md
│   └── 03-summary.md
│
├── 80-practical-build-container/
│   ├── 00-overview.md
│   ├── 01-build-rootfs.md
│   ├── 02-chroot.md
│   ├── 03-pivot-root.md
│   ├── 04-add-namespaces.md
│   ├── 05-add-cgroups.md
│   ├── 06-add-overlayfs.md
│   ├── 07-add-networking.md
│   ├── 08-drop-capabilities.md
│   ├── 09-run-process.md
│   └── 10-summary.md
│
├── 90-observability-labs/
│   ├── procfs.md
│   ├── sysfs.md
│   ├── iptables.md
│   ├── mounts.md
│   └── namespaces.md
│
├── 95-failure-labs/
│   ├── kill-pid1.md
│   ├── exceed-memory.md
│   ├── break-mount.md
│   └── remove-veth.md
│
└── 99-appendix/
    ├── kernel-references.md
    ├── man-pages.md
    ├── books.md
    └── further-reading.md
```

---

# 📁 labs/  (Hands-On Material)

```
labs/
├── silos/
│   ├── pid-ns/
│   ├── mount-ns/
│   ├── net-ns/
│   └── user-ns/
│
├── cgroups/
│   ├── cpu/
│   ├── memory/
│   └── pids/
│
├── overlayfs/
│   ├── basic/
│   └── whiteouts/
│
├── networking/
│   ├── veth/
│   ├── bridge/
│   └── nat/
│
└── build-container/
    ├── stage1-rootfs/
    ├── stage2-chroot/
    ├── stage3-namespaces/
    ├── stage4-cgroups/
    ├── stage5-network/
    └── final/
```

Each lab folder:

```
README.md
run.sh
cleanup.sh
expected-output.txt
```

---

# 📁 scripts/

```
scripts/
├── common.sh
├── netns.sh
├── cgroup.sh
├── overlay.sh
└── mini-container.sh
```

---

# 📁 diagrams/

```
diagrams/
├── namespaces/
├── cgroups/
├── overlayfs/
├── networking/
└── runtime-flow/
```

---

# 📁 assets/

```
assets/
├── logo/
├── screenshots/
└── gifs/
```

---

# 🎯 Why This Tree Scales Well

✅ Chapters ordered numerically
✅ Theory separated from labs
✅ Final build isolated
✅ Easy CI/CD docs build
✅ Friendly for contributors

---

If you want next, I can generate:

➡️ `mkdocs.yml` navigation
➡️ README template for each chapter
➡️ Lab README template
➡️ Initial `mini-container.sh` skeleton

Just tell me which one to tackle first.
