# 🛒 Clawdbot Grocery Plugin

A Clawdbot plugin for managing grocery shopping lists using dstask.

## ✨ Features

- ➕ **Add items** to your shopping list
- 📋 **List pending items** to buy
- ✅ **Mark items as bought** when purchased
- 🗑️ **Remove items** from the list
- 🧹 **Clear all bought items** to keep your list clean

## 📦 Installation

### Prerequisites

First, install dstask using mise (recommended for zero friction):

```bash
# Install dstask via mise go backend
mise use -g go:github.com/naggie/dstask@latest
```

Or install manually:
```bash
go install github.com/naggie/dstask@latest
```

### Install the Plugin

```bash
clawdbot plugins install clawd-plugin-grocery
```

Or install from GitHub:

```bash
clawdbot plugins install github:pepicrft/clawd-plugin-grocery
```

## 🚀 Usage

### 💻 CLI Commands

```bash
# 📋 List pending grocery items
clawdbot grocery list

# ➕ Add items to the list
clawdbot grocery add milk eggs bread

# ✅ Mark item as bought
clawdbot grocery done 42

# 🗑️ Remove item from list
clawdbot grocery remove 42

# 🧹 Clear all bought items
clawdbot grocery clear
```

### 🤖 Tool (for Claude)

Claude can manage your grocery list using the `grocery_list` tool:

```
Hey, add milk and eggs to my grocery list 🥛🥚
```

```
What's on my grocery list? 🛒
```

```
Mark item 42 as bought ✅
```

### 🌐 Gateway RPC

```bash
# 📋 List items
curl -X POST http://localhost:3000/api/gateway/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "grocery.list"}'

# ➕ Add item
curl -X POST http://localhost:3000/api/gateway/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "grocery.add", "params": {"item": "milk"}}'

# ✅ Mark as bought
curl -X POST http://localhost:3000/api/gateway/rpc \
  -H "Content-Type: application/json" \
  -d '{"method": "grocery.done", "params": {"id": "42"}}'
```

## 📋 Requirements

- [dstask](https://github.com/naggie/dstask) must be installed and available in your PATH
- 💡 **Tip:** Use `mise use -g go:github.com/naggie/dstask@latest` for hassle-free installation!

## 🔧 How It Works

This plugin uses dstask with the `+grocery` tag to manage your shopping list. Items are stored as dstask tasks, making them:

- 💾 **Persistent** across sessions
- 🔍 **Searchable** with dstask's powerful query features
- 🔄 **Integrated** with your existing task management workflow
- 🗂️ **Git-backed** for automatic version control

## 🛠️ Development

```bash
# Clone the repo
git clone https://github.com/pepicrft/clawd-plugin-grocery.git
cd clawd-plugin-grocery

# Install dependencies
npm install

# Build
npm run build

# Test
npm test
```

## 📄 License

MIT © Pedro Piñera

## 🔗 Links

- 🏠 [Repository](https://github.com/pepicrft/clawd-plugin-grocery)
- 📚 [Clawdbot Plugin Docs](https://docs.clawd.bot/plugin)
- 🛠️ [dstask](https://github.com/naggie/dstask)
