---
sidebar_position: 4
---
# User Namespaces

> Run as "root", not root

5. User IDs (UID) and Group IDs (GID)

Linux manages permissions based on IDs.

    Root (UID 0): The all-powerful user.

    Capabilities: A more modern way Linux breaks down "root powers" into smaller pieces (like the ability to reboot or change the system clock).

    The Goal: Namespaces allow a user to be "root" inside a container (UID 0) while being a "nobody" (UID 1001) on the actual host machine.


# why docker as root is a concern and what rootless containers are
