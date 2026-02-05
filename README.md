# OpenClaw Grocery Plugin

[![CI](https://github.com/pepicrft/openclaw-plugin-grocery/actions/workflows/ci.yml/badge.svg)](https://github.com/pepicrft/openclaw-plugin-grocery/actions/workflows/ci.yml)

An OpenClaw plugin for managing grocery shopping lists using dstask.

## Features

- **Add items** to your shopping list
- **List pending items** to buy
- **Mark items as bought** when purchased
- **Remove items** from the list
- **Clear all bought items** to keep your list clean

## Installation

### Prerequisites

First, install dstask using mise (recommended for zero friction):

```bash
# Install dstask via mise go backend
mise use -g go:github.com/naggie/dstask/cmd/dstask@latest
```

Or install manually:
```bash
go install github.com/naggie/dstask/cmd/dstask@latest
```

### Install the Plugin

```bash
openclaw plugins install openclaw-plugin-grocery
```

Or install from GitHub:

```bash
openclaw plugins install github:pepicrft/openclaw-plugin-grocery
```

## Usage

### CLI Commands

```bash
# List pending grocery items
openclaw grocery list

# Add items to the list
openclaw grocery add milk eggs bread

# Mark item as bought
openclaw grocery done 42

# Remove item from list
openclaw grocery remove 42

# Clear all bought items
openclaw grocery clear
```

### Tool (for Claude)

Claude can manage your grocery list using the `grocery_list` tool:

```
Hey, add milk and eggs to my grocery list
```

```
What's on my grocery list?
```

```
Mark item 42 as bought
```

### Gateway RPC

```bash
# List items
curl -X POST http://localhost:3000/api/gateway/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "grocery.list"}'

# Add item
curl -X POST http://localhost:3000/api/gateway/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "grocery.add", "params": {"item": "milk"}}'

# Mark as bought
curl -X POST http://localhost:3000/api/gateway/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "grocery.done", "params": {"id": "42"}}'
```

## Requirements

- [dstask](https://github.com/naggie/dstask) must be installed and available in your PATH
- **Tip:** Use `mise use -g go:github.com/naggie/dstask/cmd/dstask@latest` for hassle-free installation!

## How It Works

This plugin uses dstask with the `+grocery` tag to manage your shopping list. Items are stored as dstask tasks, making them:

- **Persistent** across sessions
- **Searchable** with dstask's powerful query features
- **Integrated** with your existing task management workflow
- **Git-backed** for automatic version control

## Development

```bash
# Clone the repo
git clone https://github.com/pepicrft/openclaw-plugin-grocery.git
cd openclaw-plugin-grocery

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch mode
npm run test:watch

# Test UI
npm run test:ui
```

### Testing

This plugin uses [Vitest](https://vitest.dev/) for testing. The test suite includes:

- Plugin registration tests
- Tool handler validation tests
- Input schema validation tests
- CI pipeline that runs on every commit

CI runs tests on Node.js 20.x and 22.x to ensure compatibility.

## License

MIT (c) Pedro Pinera

## Links

- [Repository](https://github.com/pepicrft/openclaw-plugin-grocery)
- [OpenClaw Plugin Docs](https://docs.openclaw.ai/plugin)
- [dstask](https://github.com/naggie/dstask)
