# Containers Explained

> Containers are cool

![logo](./static/img/logo.png)

A simple, comprehensive guide to understanding containers, namespaces, and how they work under the hood. This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

Deep enough to understand the magic under the hood and not just google error messages. Concise enough that you dont get lost in the details and call yourself a kernel engineer.

## Features

- **Tutorials**: Step-by-step guides to understanding container basics.
- **Deep Dives**: Explanations of core concepts like Linux Namespaces.
- **Modern UI**: Clean and responsive design powered by Docusaurus.

## Tech Stack

- **Framework**: [Docusaurus 3](https://docusaurus.io/)
- **Language**: TypeScript / React
- **Styling**: Standard Docusaurus styling

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [Yarn](https://yarnpkg.com/) package manager

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/darshanraul/containers-explained.git
cd containers-explained
yarn install
```

### Local Development

Start the local development server:

```bash
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Building

Generate static content into the `build` directory:

```bash
yarn build
```

This static content can be served using any static hosting service.

# Roadmap

- [ ] namespaces
    - lsns
    - nsenter
    - unshare
    - [ ] pid
        - [] pid basics
        - proc folder
    - [ ] mnt
    - [ ] net
    - [ ] ipc
    - [ ] uts
    - [ ] user
- [ ] cgroups
- [ ] overlayfs