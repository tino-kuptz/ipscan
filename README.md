# IP Scanner

Fast network scanner including port scanner. Runs on Windows, macOS and Linux thanks to Electron (theoretically)

<img src="readme/screenshot-range.png" width="45%"></img> <img src="readme/screenshot-subnet.png" width="45%"></img> 

## Features

- **IP Range Scanning**: Scan from IP X to IP Y (e.g. `192.168.120.10` to `192.168.120.55`)
- **Subnet Scanning**: Alternatively: scan entire subnets with subnet mask<br>(e.g. `192.168.120.0` with `255.255.255.0`)
- **Port Scanning**: Specify a comma-separated list of TCP ports to be checked
- **Fast Filtering in the App**: Display all hosts, hosts with at least one open port, or hosts that are generally online
- **Hostname and MAC**: so you don't have to use two different scanners on macOS to get both pieces of information

## Technology Stack

- **Frontend**: Vue.js 3 with TypeScript
- **Backend**: Electron with Node.js
- **Styling**: Modern CSS with gradients and animations
- **Build Tool**: Vite for fast development

## Installation
Will probably only work on macOS, but with luck also on Linux.

1. **Install dependencies**:
```bash
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Create production build**:
set `SKIP_SIGNING=true` so you don't need to sign this application.  
Otherwise you need to install some requirements:
```bash
brew install openssl
brew install jsign
cargo install --features smartcard apple-codesign
```
> [!WARNING]  
> At the time of this writing apple-codesign does not yet support PCKS#11  
> For building I use the [pull-request #198 by stanhu](https://github.com/indygreg/apple-platform-rs/pull/198)

After installing all required things (or setting the env var), you may run
```bash
npm run build
```

## Architecture

### Frontend (Vue.js)
Located in the `/src` directory

### Backend (Electron)
Located in the `/electron` directory

### Scripts
Currently only two relevant ones:
- `npm run dev`: Builds Electron, starts Vite, and then opens Electron on `http://localhost:5173`
- `npm run build`: Builds the entire application for the current architecture
- `npm run build:cross`: Builds the entire application for all architectures

Important note about `npm run dev` - the frontend supports hot reloading thanks to Vite, the backend does not. That was too much effort for me during development, when the alternative for backend changes is simply CTRL+C, arrow key up and Enter.

### Pull requests
Are welcome