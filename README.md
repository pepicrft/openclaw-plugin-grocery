# 🛒 Clawdbot Grocery Plugin

A Clawdbot plugin for managing grocery shopping lists using dstask.

## Features

- **Add items** to your shopping list
- **List pending items** to buy
- **Mark items as bought** when purchased
- **Remove items** from the list
- **Clear all bought items** to keep your list clean

## Installation

```bash
clawdbot plugins install clawd-plugin-grocery
```

Or install from GitHub:

```bash
clawdbot plugins install github:pepicrft/clawd-plugin-grocery
```

## Usage

### CLI Commands

```bash
# List pending grocery items
clawdbot grocery list

# Add items to the list
clawdbot grocery add milk eggs bread

# Mark item as bought
clawdbot grocery done 42

# Remove item from list
clawdbot grocery remove 42

# Clear all bought items
clawdbot grocery clear
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
curl -X POST http://localhost:3000/api/gateway/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "grocery.list"}'
```

```bash
curl -X POST http://localhost:3000/api/gateway/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "grocery.add", "params": {"item": "milk"}}'
```

## Requirements

- [dstask](https://github.com/naggie/dstask) must be installed and available in your PATH

## How It Works

This plugin uses dstask with the `+grocery` tag to manage your shopping list. Items are stored as dstask tasks, making them:

- **Persistent** across sessions
- **Searchable** with dstask's powerful query features
- **Integrated** with your existing task management workflow

## License

MIT © Pedro Piñera
