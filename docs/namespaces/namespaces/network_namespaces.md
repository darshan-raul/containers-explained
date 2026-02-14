---
sidebar_position: 6
---

# Network Namespaces

- network interfaces
- routing table
- firewall rules

Network Namespace + /proc/net

Inside a container:

cat /proc/net/dev


Shows:

eth0
lo


On the host:

eth0
docker0
vethxxx
cni0
...


/proc/net/* is namespace-scoped.

Each network namespace has its own TCP table:

/proc/net/tcp
/proc/net/route


So netstat and ss work per container because they read /proc.