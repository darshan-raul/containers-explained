
# Roadmap 


## 1. 🧱 making the [Silos](../namespaces/process.md) - You see only what you need to see

> A container is a isolated process/s.

- understand that containers are just isolated processes
- what namespaces are and their types
- Deep dive into each namespace
- Creating our own namespaces

## 2. 🚧 Putting the [Fences](../cgroups/cgroup.md) — You only get what you ask for

> Containers have limited resources

- what cgroups are and why we need them
- different typed of controllers
- creating cgroups and attaching processes to them
- v1 vs v2

## 3. 📦 Manage the Cargo — Images,Layers and overlayfs

> A container is a filesystem illusion.

- what a container image actually is
- what are layers
- You need a container to create an image!
- what is a union filesystem
- what is copy-on-write


## 4. 🔨 What is under the hood? — containerd,runc and OCI

> Revealing the magic trick

- What is containerd
- its runc actually
- what is OCI
- Trace a container creation from start to end


## 5. 🧵 Wires — How networking works

> Containers are isolated… but must communicate.

- How the container get the ip
- Whats a bridge?
- what are the firewall changes needed.
- How do containers talk to each other?
- How does the container talk to the outside world


## 6. 🛡️ Watching the gates — Security

> Why containers aren’t just “jails”.

- Linux Capabilities
- Drop root powers
- Seccomp
- Syscall filtering
- AppArmor / SELinux
- Read-Only Root FS
- No-New-Privileges
- User Namespace Security


## 7. 👷‍♂️ Build Your Own Container


```
./mini-container run /bin/sh
```

