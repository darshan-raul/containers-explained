---
sidebar_position: 1
---

# Intro

You use containers everyday, that could be your Kubernetes, ECS clusters, your docker compose files, your [lambda functions](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html), your CI/CD pipelines, your local development environment! [devcontainers say 👋](https://code.visualstudio.com/docs/devcontainers/containers)

Not so simple as `docker run -it ubuntu ` **and did I get complete ubuntu on my machine!?**


## What this guide is not

- Not a hello world guide on how to use docker and run containers.
- Not a tutorial on docker features like port forwarding, networks etc [although we will be exploring them but as a inside man]
- Not a best pratice guide on creating smaller container images, how to use multi stage builds, how to use distroless images etc
- Not a guide on how to use docker compose >>> and  kubernetes, ECS etc

## What this guide is

- You will know the mechanics behind the rabbit magic trick 🐇🎩 that containers make you believe
- You can easily debug the 3am bug next time it occurs in production [I dont claim you will, but may be :D]
- You will easily understand what constraints are on your containers and pods and how to tune them
- You will understand what **layers** actually are, what a **bridge** is, what **-P 8080:8080** actually does

## Why do I need to know this

- If you just started with docker or are not a SRE/DevOps/Platform engineer, you can actually skip this guide. Its good to not know the stuff you dont need. Docker and K8s are good abstractions!
- But abstractions are only good until they break! 
- When they break, you need to go the actual plumbing during a prod issue
- We dont need to go down the rabbit hole and become a kerner developer! But knowing the internals is the pragmatic sweet spot where you understand whats happening and can fix it! [or spin up that new node :D]
