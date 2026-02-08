---
sidebar_position: 3
---

# Under the hood

We will try to understand how to look at and enter namespaces using the tools available to us. We will also try to understand the basic proc filesystem which is a major concept to be aware about.


## Checking the namespaces


lsns

The /proc Filesystem

This is a "pseudo-filesystem." It doesn't exist on your hard drive; it exists in the RAM.

    Navigate to /proc/[pid]/ns/. This is where the kernel actually exposes the namespaces associated with a specific process. If you can't navigate /proc, namespaces will feel like "black box" magic rather than visible system files.


## Looking into the nsenter

## whats unshare

- clone command

