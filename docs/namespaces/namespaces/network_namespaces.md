---
sidebar_position: 6
---

# Network Namespaces

- network interfaces
- routing table
- firewall rules



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