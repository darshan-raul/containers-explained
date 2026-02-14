UTS Namespace + /proc/sys/kernel/hostname

Inside a container:

cat /proc/sys/kernel/hostname


Different from host.

Why?
UTS namespace isolates hostname + domainname.