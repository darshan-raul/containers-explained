---
sidebar_position: 2
---

# Namespaces

This comes straight from the `man namespaces` command:

> A  namespace **wraps a global system resource in an abstraction that makes it appear to the processes within the namespace that they have their own isolated instance of the global resource**.  Changes to the global resource are visible to other processes that are members of the namespace, but are invisible to other processes.  **One use of namespaces is to implement containers**.


## Namespace blitz:

We will dive into the theory later first see it for yourself:


```bash
# Check current hostname in parent namespace
 $ hostname
myhost

# Create a new UTS namespace and change hostname
 $ sudo unshare -u /bin/bash
# hostname
myhost
# hostname newhostname
# hostname
newhostname

# In another terminal, verify parent hostname unchanged
 $ hostname
myhost
```

You see its like there was no change on the hostmachine, it was only in the namespace 

```
PID=$(docker inspect -f '{{.State.Pid}}' mycontainer)
sudo ls -l /proc/$PID/ns
```

