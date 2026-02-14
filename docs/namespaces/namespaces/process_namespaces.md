---
sidebar_position: 5
---
# Process Namespaces


- pid
- init process
: When a process starts another (using fork() or exec()), it creates a tree-like hierarchy


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