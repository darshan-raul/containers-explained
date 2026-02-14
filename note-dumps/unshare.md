## Learning Linux Namespaces with `unshare` – A Hands‑On Tutorial

This tutorial will guide you through Linux namespaces and how to create and interact with them using the `unshare` command. By the end, you’ll have a practical understanding of how containers achieve isolation and how you can experiment with namespaces on your own machine.

### Prerequisites

- A Linux system (I’ll assume Ubuntu 22.04, but any recent distribution should work).
- Basic familiarity with the command line.
- `unshare` and `nsenter` from the `util-linux` package – they are usually installed by default.
- Root access (sudo) for some examples, though many can be run as a normal user thanks to user namespaces.

Let’s begin!

---

## 1. Introduction to Linux Namespaces

Namespaces are a feature of the Linux kernel that partition kernel resources so that one set of processes sees one set of resources while another set of processes sees a different set. They are the building blocks of containerization (like Docker, LXC) and provide isolation and security.

Each namespace wraps a particular global system resource in an abstraction that makes it appear to the processes within the namespace that they have their own isolated instance of that resource. Common namespace types include:

| Namespace | Isolation |
|-----------|-----------|
| **mount** | Mount points (filesystem hierarchy) |
| **PID**   | Process IDs |
| **net**   | Network devices, stacks, ports, etc. |
| **UTS**   | Hostname and domain name |
| **user**  | User and group IDs |
| **IPC**   | System V IPC, message queues, shared memory |
| **cgroup**| Cgroup root directory (rarely used directly) |
| **time**  | Boot and monotonic clocks (newer) |

When you create a new process with `unshare`, you can place it in new namespaces, either creating fresh ones or inheriting existing ones.

---

## 2. The `unshare` Command

`unshare` runs a program with some namespaces unshared from the parent. In other words, it creates new namespaces for the child process (and its descendants) according to the options you provide.

**Syntax**:
```bash
unshare [options] program [arguments]
```

### Important Options

| Option | Description |
|--------|-------------|
| `--mount`, `-m` | Unshare the mount namespace |
| `--pid`, `-p` | Unshare the PID namespace |
| `--net`, `-n` | Unshare the network namespace |
| `--uts`, `-u` | Unshare the UTS namespace |
| `--user`, `-U` | Unshare the user namespace |
| `--ipc`, `-i` | Unshare the IPC namespace |
| `--cgroup`, `-C` | Unshare the cgroup namespace |
| `--time`, `-T` | Unshare the time namespace |
| `--fork`, `-f` | Fork the child process (needed for PID namespace to work correctly) |
| `--mount-proc` | Mount a new procfs at `/proc` after creating the PID namespace (implies `--fork`) |
| `--propagation` | Set mount propagation (shared, slave, private, unbindable) for the new mount namespace |
| `--map-root-user` | Map the current (unprivileged) user to root inside the user namespace |

We’ll explore these options in the examples.

---

## 3. Step‑by‑Step Examples for Each Namespace

Before we start, open a terminal. We’ll run most commands as a normal user; when root is required I’ll use `sudo`.

### Inspecting Namespace Membership

A process’s namespaces can be viewed via `/proc/self/ns/` (or `/proc/PID/ns/`). Each file is a symbolic link to a namespace identifier.

```bash
ls -l /proc/self/ns/
```

You’ll see output like:
```
lrwxrwxrwx 1 user user 0 Feb 14 10:00 cgroup -> 'cgroup:[4026531835]'
lrwxrwxrwx 1 user user 0 Feb 14 10:00 ipc -> 'ipc:[4026531839]'
lrwxrwxrwx 1 user user 0 Feb 14 10:00 mnt -> 'mnt:[4026531841]'
lrwxrwxrwx 1 user user 0 Feb 14 10:00 net -> 'net:[4026531840]'
lrwxrwxrwx 1 user user 0 Feb 14 10:00 pid -> 'pid:[4026531836]'
lrwxrwxrwx 1 user user 0 Feb 14 10:00 user -> 'user:[4026531837]'
lrwxrwxrwx 1 user user 0 Feb 14 10:00 uts -> 'uts:[4026531838]'
```

The numbers in brackets are unique identifiers for each namespace. When a process is created in a new namespace, those numbers will differ from the parent’s.

Now, let’s dive into each namespace.

---

### 3.1 Mount Namespace

**Goal**: Create a new mount namespace where we can mount a temporary filesystem without affecting the host.

1. Start a bash shell in a new mount namespace:
   ```bash
   unshare --mount bash
   ```

   After running this, you are inside a new shell that has its own mount namespace. Verify that the mount namespace is different:
   ```bash
   readlink /proc/self/ns/mnt
   ```
   Compare with the same command in another terminal (the host). They should be different.

2. Inside the new namespace, create a mount point and mount a tmpfs:
   ```bash
   mkdir /tmp/mymount
   mount -t tmpfs tmpfs /tmp/mymount
   ```

   Now, create a file there:
   ```bash
   echo "Hello from namespace" > /tmp/mymount/test.txt
   cat /tmp/mymount/test.txt
   ```

3. From the **host** (another terminal), check if the mount is visible:
   ```bash
   ls /tmp/mymount   # should be empty or not exist
   mount | grep tmpfs
   ```
   The mount does not appear on the host because mount namespaces isolate mount points.

4. Exit the namespace shell (`exit`). The tmpfs disappears automatically.

**Explanation**: The new mount namespace inherits a copy of the parent’s mount tree. Changes (mounts/umounts) inside the namespace are private to that namespace. This is how containers get their own filesystem views.

---

### 3.2 PID Namespace

**Goal**: Create a new PID namespace where the first process has PID 1, and other processes have PIDs isolated from the host.

**Important**: For a PID namespace to be useful, the first process in that namespace (the one with PID 1) must act as an init process (reap zombies, handle signals). Using `--fork` ensures the program becomes PID 1. Also, we need to mount a new `/proc` to see the correct PIDs.

1. Run:
   ```bash
   sudo unshare --pid --fork --mount-proc bash
   ```
   - `--pid` creates a new PID namespace.
   - `--fork` makes the child process the one that executes bash, and it becomes PID 1 in the new namespace.
   - `--mount-proc` automatically mounts a new proc filesystem at `/proc` inside the namespace (it also implies `--mount` to unshare the mount namespace, ensuring the new proc mount doesn’t affect the host).

2. Inside the new shell, check the PID of the current shell:
   ```bash
   echo $$
   ```
   It should show `1`. Also look at all processes:
   ```bash
   ps aux
   ```
   You’ll see only a few processes (bash, ps) with PIDs starting from 1, isolated from the host’s process list.

3. From the host, find the PID of that bash process (e.g., using `pgrep -f bash`) and verify its PID in the host’s view is something else (e.g., 12345). The namespace’s PID 1 corresponds to that host PID.

4. Exit the namespace shell. The entire PID namespace is destroyed when the last process in it exits.

**Without `--fork`**: Try `sudo unshare --pid bash` and then `echo $$`. You’ll see that the shell still has the same PID as in the host (because the shell wasn’t forked; it’s still in the parent’s PID namespace). The unshare only affects future children. Hence `--fork` is usually necessary.

---

### 3.3 Network Namespace

**Goal**: Create a network namespace with only a loopback interface, then add a virtual Ethernet pair to communicate with the host.

1. Create a new network namespace and run bash:
   ```bash
   sudo unshare --net bash
   ```

2. Inside, check network interfaces:
   ```bash
   ip link
   ```
   You’ll see only `lo` (loopback), and it’s probably down. Bring it up:
   ```bash
   ip link set lo up
   ping 127.0.0.1   # should work now
   ```
   No other interfaces (eth0, wlan0) are present – the namespace is completely isolated from the host’s network.

3. To communicate with the host, we can create a virtual Ethernet pair. **In another terminal (host)**, create a veth pair:
   ```bash
   sudo ip link add veth0 type veth peer name veth1
   ```
   Move one end (`veth1`) into the namespace. First, find the PID of the bash process inside the namespace (e.g., `pgrep -f bash`). Then:
   ```bash
   sudo ip link set veth1 netns <PID>
   ```
   Now, back in the namespace terminal, you can see `veth1`:
   ```bash
   ip link
   ```
   Assign IPs and bring them up:
   - In namespace: `ip addr add 192.168.100.2/24 dev veth1; ip link set veth1 up`
   - In host: `ip addr add 192.168.100.1/24 dev veth0; ip link set veth0 up`

   Now ping from namespace to host: `ping 192.168.100.1`. You have a network connection!

4. Clean up when done: delete the veth pair from host (`sudo ip link del veth0`). The namespace will disappear when you exit.

**Verification**: Run `ip link` on host and in namespace to see the isolation.

---

### 3.4 UTS Namespace

**Goal**: Change the hostname inside the namespace without affecting the host.

1. Create a new UTS namespace and run bash:
   ```bash
   sudo unshare --uts bash
   ```

2. Check the current hostname:
   ```bash
   hostname
   ```

3. Change it:
   ```bash
   hostname my-container
   ```

4. Verify with `hostname`. In another terminal on the host, the hostname remains unchanged.

**Why use `sudo`?** Changing hostname normally requires `CAP_SYS_ADMIN`. In a new UTS namespace, the process can have that capability (if run as root). For unprivileged users, you can combine with a user namespace (see later).

---

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

---

### 3.6 IPC Namespace

**Goal**: Isolate System V IPC objects (message queues, shared memory).

1. As root (or with sudo), create a message queue on the host to see:
   ```bash
   sudo ipcmk -Q
   ipcs -q
   ```
   Note the key.

2. Now create a new IPC namespace and run bash:
   ```bash
   sudo unshare --ipc bash
   ```

3. Inside, list IPC queues:
   ```bash
   ipcs -q
   ```
   It should be empty (no queues visible). The queue you created on the host is not visible here.

4. Create a new queue inside:
   ```bash
   sudo ipcmk -Q   # still need sudo? Actually inside you might be root anyway.
   ipcs -q
   ```
   It shows the new queue.

5. Exit and check on host: the original queue still exists, the new one is gone (destroyed when the namespace ended).

**Note**: IPC namespaces isolate System V IPC objects and POSIX message queues. They are less commonly used but important for some applications.

---

### 3.7 Combined Namespaces

**Goal**: Create a process that has multiple new namespaces simultaneously, mimicking a lightweight container.

We can combine several flags. For example, create a new mount, PID, and UTS namespace:

```bash
sudo unshare --mount --pid --fork --mount-proc --uts bash
```

Inside, verify:
- Hostname can be changed without affecting host (UTS).
- `echo $$` shows 1 (PID namespace).
- Mounting a tmpfs is isolated (mount namespace).

You can even add `--net` to have a private network. Combined namespaces give you the core of a container.

---

## 4. Interacting with Existing Namespaces Using `nsenter`

`nsenter` allows you to run a program in the namespaces of an existing process. This is useful for debugging containers or joining a namespace.

**Syntax**:
```bash
nsenter [options] program [arguments]
```
Options: `--target PID` (the process whose namespaces to enter) plus namespace‑specific flags (`--mount`, `--pid`, `--net`, etc.). If you don’t specify any namespace flags, it enters all namespaces of the target.

### Example: Entering a Mount Namespace

1. Start a process with a new mount namespace (e.g., `sudo unshare --mount bash`) and keep it running. Note its PID (e.g., 12345).

2. From another terminal, enter its mount namespace and run a shell:
   ```bash
   sudo nsenter --target 12345 --mount bash
   ```

   Now you are in the same mount namespace as that process. Any mounts you perform will be visible there.

### Example: Entering All Namespaces

If you have a container process with multiple new namespaces, you can enter all:

```bash
sudo nsenter --target 12345 --all bash
```

This drops you into a shell inside that process’s complete set of namespaces.

### Finding Namespace Files

Namespaces are represented by files under `/proc/PID/ns/`. You can directly use those files with `nsenter`:

```bash
sudo nsenter --mount=/proc/12345/ns/mnt bash
```

But it’s easier to use `--target` and let `nsenter` read them.

**Note**: Entering a PID namespace requires that the target process is still alive and that you have appropriate permissions. For PID namespaces, the new process will have a different PID inside that namespace, and you need to be careful with `/proc` (you might need to mount a new proc inside). Often it’s simpler to use `--all` and rely on the existing proc mount.

---

## 5. Advanced Topics

### 5.1 Why `--fork` is Often Needed with PID Namespaces

When you create a new PID namespace with `unshare --pid`, the `unshare` process itself is not moved into the new namespace; only its children are. If you then run `bash` directly, `unshare` execs `bash` without forking, so `bash` remains in the original PID namespace (because `unshare` didn’t create a child). By using `--fork`, `unshare` forks a child, and that child enters the new namespace and becomes PID 1. The child then execs your program. That’s why you almost always need `--fork` with `--pid`.

### 5.2 Properly Setting Up `/proc` in a New PID Namespace

Inside a new PID namespace, the existing `/proc` still shows the host’s processes. To get a correct view, you must mount a new proc filesystem. The `--mount-proc` option does two things:
- Unshares the mount namespace (so the new mount doesn’t affect the host).
- Mounts proc at `/proc`.

If you don’t use `--mount-proc`, you can manually mount it after unsharing both PID and mount namespaces:

```bash
sudo unshare --pid --fork --mount bash
mount -t proc proc /proc
```

### 5.3 Mount Propagation

Mount propagation determines how mount events are propagated between mount namespaces. By default, mounts are **private** – they don’t propagate. But if you create a new mount namespace with `unshare --mount`, the new namespace receives a **copy** of the parent’s mount tree, and the propagation type is **shared** for mounts that are marked shared on the host (like `/` on many systems). This can cause unexpected behavior: if you bind‑mount something in the new namespace, it may propagate back to the host if the mount point is shared.

You can control this with the `--propagation` flag. For example, to make all mounts in the new namespace private:

```bash
unshare --mount --propagation private bash
```

This is often what you want for isolation.

### 5.4 User Namespace Details

- **ID mapping**: When you use `--map-root-user`, it sets up a mapping that maps your UID to 0 inside the namespace. You can also create custom mappings with `--map-user` and `--map-group` (advanced).
- **Capabilities**: Inside a user namespace, a process can have capabilities even if it’s unprivileged outside. However, these capabilities are only effective for resources tied to that namespace (e.g., mounting in a mount namespace that is also owned by that user namespace).
- **Interaction with other namespaces**: A user namespace is often the “owner” of other namespaces. For instance, if you create a new mount namespace while also in a new user namespace, the mount namespace is owned by that user namespace. That’s why unprivileged users can create mount namespaces (with `--user --mount`).

### 5.5 Combining Namespaces to Mimic a Container

A minimal container could be started with:

```bash
unshare --user --map-root-user \
        --mount --propagation private \
        --pid --fork --mount-proc \
        --uts \
        --net \
        --ipc \
        bash
```

This gives you a shell with almost full isolation. You can then, for example, change hostname, set up networking with veth pairs, and have a separate PID tree. This is the essence of container runtimes.

---

## 6. Potential Pitfalls and Debugging Tips

### Permission Issues
- Some namespaces (mount, PID, network, etc.) require `CAP_SYS_ADMIN`. If you’re not root, you must combine them with a user namespace (`--user`) to gain capabilities.
- On some distributions, unprivileged user namespaces are disabled by default. Check with `sysctl kernel.unprivileged_userns_clone`. You may need to enable it or use sudo.

### Forgetting `--fork` with PID Namespace
- Without `--fork`, your shell won’t be in the new PID namespace. Always use `--fork` (and often `--mount-proc`).

### `/proc` Not Reflecting the New PID Namespace
- After creating a PID namespace, you must mount a new `/proc`. Use `--mount-proc` or manually mount it. Otherwise, tools like `ps` will show host processes.

### Network Namespace Configuration
- A new network namespace starts with only `lo` down. You need to bring it up. To communicate with the host, you must create veth pairs and assign IPs. This requires root (or capabilities in a user namespace). For a quick test, you can run a simple web server inside and use `nsenter` to connect.

### Checking Which Namespaces a Process Is In
- Use `ls -l /proc/PID/ns/`. Compare the inode numbers with those of another process. If they match, they share that namespace.

### Cleanup
- Namespaces are automatically destroyed when the last process in them exits. However, resources like veth pairs may need manual deletion on the host.

---

## 7. Conclusion

You’ve now seen how to create and interact with Linux namespaces using `unshare` and `nsenter`. These tools are the foundation of containerization. By combining namespaces, you can achieve strong isolation of processes. Experiment with different combinations, try to set up a more complex environment (like running a web server in a network namespace), and you’ll gain a deep understanding of how containers work under the hood.

Remember, namespaces are just one part of the puzzle – control groups (cgroups) handle resource limits, and filesystem layers handle image distribution. But namespaces give you the isolation that makes containers possible.

Happy hacking!