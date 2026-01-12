import { execSync } from "child_process";
const GROCERY_TAG = "+grocery";
const DSTASK_CMD = "dstask";
function execDstask(args) {
    try {
        return execSync(`${DSTASK_CMD} ${args.join(" ")}`, {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        }).trim();
    }
    catch (error) {
        throw new Error(`dstask command failed: ${error.message}`);
    }
}
function parseTaskLine(line) {
    // Parse dstask output format: "ID status priority description tags"
    const match = line.match(/^(\d+)\s+(\S+)\s+(.+?)(?:\s+\+[\w-]+)*$/);
    if (!match)
        return null;
    const [, id, status, description] = match;
    const tags = line.match(/\+[\w-]+/g) || [];
    return { id, description: description.trim(), status, tags };
}
function listGroceries() {
    const output = execDstask(["next", GROCERY_TAG]);
    return output
        .split("\n")
        .map(parseTaskLine)
        .filter((item) => item !== null);
}
function addGroceryItem(item) {
    execDstask(["add", item, GROCERY_TAG]);
    return `Added "${item}" to grocery list`;
}
function markAsBought(id) {
    execDstask(["done", id]);
    return `Marked item ${id} as bought`;
}
function removeItem(id) {
    execDstask(["remove", id]);
    return `Removed item ${id} from grocery list`;
}
function clearBoughtItems() {
    const completed = execDstask(["show-resolved", GROCERY_TAG]);
    const lines = completed.split("\n").filter((l) => l.trim());
    if (lines.length === 0) {
        return "No bought items to clear";
    }
    const ids = lines.map(parseTaskLine).filter((item) => item !== null).map((item) => item.id);
    ids.forEach((id) => execDstask(["remove", id]));
    return `Cleared ${ids.length} bought item(s)`;
}
export default function (api) {
    // Register CLI commands
    api.registerCli(({ program }) => {
        const grocery = program.command("grocery").description("Manage grocery shopping list");
        grocery
            .command("list")
            .description("List pending grocery items")
            .action(() => {
            const items = listGroceries();
            if (items.length === 0) {
                console.log("🛒 Grocery list is empty");
                return;
            }
            console.log("🛒 Grocery List:");
            items.forEach((item) => {
                console.log(`  ${item.id}. ${item.description}`);
            });
        });
        grocery
            .command("add <item...>")
            .description("Add item(s) to grocery list")
            .action((items) => {
            const description = items.join(" ");
            console.log(addGroceryItem(description));
        });
        grocery
            .command("done <id>")
            .description("Mark item as bought")
            .action((id) => {
            console.log(markAsBought(id));
        });
        grocery
            .command("remove <id>")
            .description("Remove item from list")
            .action((id) => {
            console.log(removeItem(id));
        });
        grocery
            .command("clear")
            .description("Clear all bought items")
            .action(() => {
            console.log(clearBoughtItems());
        });
    }, { commands: ["grocery"] });
    // Register tool for Claude to use
    api.registerTool({
        name: "grocery_list",
        description: "Manage grocery shopping list using dstask. Add items, list pending items, mark as bought, or clear completed items.",
        input_schema: {
            type: "object",
            properties: {
                action: {
                    type: "string",
                    enum: ["list", "add", "done", "remove", "clear"],
                    description: "Action to perform: list (show pending), add (new item), done (mark bought), remove (delete item), clear (remove all bought)",
                },
                item: {
                    type: "string",
                    description: "Item description (for 'add' action)",
                },
                id: {
                    type: "string",
                    description: "Item ID (for 'done' or 'remove' actions)",
                },
            },
            required: ["action"],
        },
        handler: async ({ action, item, id }, { respond }) => {
            try {
                let result;
                switch (action) {
                    case "list":
                        const items = listGroceries();
                        result =
                            items.length === 0
                                ? "Grocery list is empty"
                                : `Grocery list:\n${items.map((i) => `${i.id}. ${i.description}`).join("\n")}`;
                        break;
                    case "add":
                        if (!item)
                            throw new Error("Item description is required for 'add' action");
                        result = addGroceryItem(item);
                        break;
                    case "done":
                        if (!id)
                            throw new Error("Item ID is required for 'done' action");
                        result = markAsBought(id);
                        break;
                    case "remove":
                        if (!id)
                            throw new Error("Item ID is required for 'remove' action");
                        result = removeItem(id);
                        break;
                    case "clear":
                        result = clearBoughtItems();
                        break;
                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
                respond(true, { ok: true, result });
            }
            catch (error) {
                respond(false, { ok: false, error: error.message });
            }
        },
    });
    // Register Gateway RPC methods
    api.registerGatewayMethod("grocery.list", async () => {
        const items = listGroceries();
        return { ok: true, items };
    });
    api.registerGatewayMethod("grocery.add", async ({ item }) => {
        const result = addGroceryItem(item);
        return { ok: true, message: result };
    });
    api.registerGatewayMethod("grocery.done", async ({ id }) => {
        const result = markAsBought(id);
        return { ok: true, message: result };
    });
}
