---
sidebar_position: 9
---

# Joining the dots

🔟 Combining Namespaces (Container Simulation)

Now let’s combine multiple.

sudo unshare \
  --mount \
  --uts \
  --ipc \
  --net \
  --pid \
  --fork \
  --mount-proc \
  bash


Inside:

You are PID 1

Hostname can change

No network except loopback

Mounts are isolated

You just built a lightweight container manually.