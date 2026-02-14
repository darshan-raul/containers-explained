---
sidebar_position: 6
---
# Process Namespaces


- pid
- init process
: When a process starts another (using fork() or exec()), it creates a tree-like hierarchy


*Goal**: Create a new PID namespace where the first process has PID 1, and other processes have PIDs isolated from the host.

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




Mount Namespace + /proc

Each container has its own mount namespace.

But here’s the subtle part:

If you don’t remount /proc inside the new mount namespace,
the container might see the host’s /proc.

That’s why container runtimes explicitly do:

mount -t proc proc /proc


inside the namespace.

This ensures:

/proc reflects container PID namespace

Host processes aren’t visible