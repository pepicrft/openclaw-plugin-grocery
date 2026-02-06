import { execSync } from "child_process";

const GROCERY_TAG = "+grocery";

interface DstaskItem {
  uuid: string;
  status: string;
  id: number;
  summary: string;
  notes: string;
  tags: string[];
  project: string;
  priority: string;
  created: string;
  resolved: string;
  due: string;
}

let miseAvailable: boolean | null = null;

function checkMiseAvailable(): boolean {
  if (miseAvailable !== null) return miseAvailable;
  
  try {
    execSync('which mise', { stdio: 'pipe' });
    miseAvailable = true;
    return true;
  } catch {
    miseAvailable = false;
    return false;
  }
}

function execDstask(args: string[]): string {
  try {
    let dstaskCmd: string;
    
    if (checkMiseAvailable()) {
      dstaskCmd = `mise exec go:github.com/naggie/dstask/cmd/dstask@latest -- dstask ${args.join(" ")}`;
    } else {
      dstaskCmd = `dstask ${args.join(" ")}`;
    }
    
    return execSync(dstaskCmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      shell: "/bin/bash",
    }).trim();
  } catch (error: any) {
    throw new Error(`dstask command failed: ${error.message}`);
  }
}

function parseDstaskJson(output: string): DstaskItem[] {
  // dstask outputs JSON by default, but it's multiline
  // We need to collect all lines from '[' to ']'
  const lines = output.split('\n');
  const jsonLines: string[] = [];
  let started = false;
  
  for (const line of lines) {
    if (line.trim().startsWith('[')) {
      started = true;
    }
    if (started) {
      jsonLines.push(line);
      if (line.trim() === ']') {
        break;
      }
    }
  }
  
  if (jsonLines.length === 0) {
    return [];
  }
  
  try {
    const json = jsonLines.join('\n');
    return JSON.parse(json) as DstaskItem[];
  } catch (error) {
    console.error('Failed to parse dstask output as JSON:', error);
    return [];
  }
}

function listGroceries(): DstaskItem[] {
  const output = execDstask(["next", GROCERY_TAG]);
  return parseDstaskJson(output);
}

function addGroceryItem(item: string): string {
  execDstask(["add", item, GROCERY_TAG]);
  return `Added "${item}" to grocery list`;
}

function markAsBought(id: string): string {
  execDstask(["done", id]);
  return `Marked item ${id} as bought`;
}

function removeItem(id: string): string {
  execDstask(["remove", id]);
  return `Removed item ${id} from grocery list`;
}

function listResolved(): DstaskItem[] {
  const output = execDstask(["show-resolved", GROCERY_TAG]);
  return parseDstaskJson(output);
}

function clearBoughtItems(): string {
  const completed = listResolved();

  if (completed.length === 0) {
    return "No bought items to clear";
  }

  completed.forEach((item) => execDstask(["remove", item.id.toString()]));

  return `Cleared ${completed.length} bought item(s)`;
}

export default function (api: any) {
  // Register CLI commands
  api.registerCli(
    ({ program }: any) => {
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
            const priority = item.priority !== "P2" ? `[${item.priority}] ` : "";
            console.log(`  ${item.id}. ${priority}${item.summary}`);
          });
        });

      grocery
        .command("add <item...>")
        .description("Add item(s) to grocery list")
        .action((items: string[]) => {
          const description = items.join(" ");
          console.log(addGroceryItem(description));
        });

      grocery
        .command("done <id>")
        .description("Mark item as bought")
        .action((id: string) => {
          console.log(markAsBought(id));
        });

      grocery
        .command("remove <id>")
        .description("Remove item from list")
        .action((id: string) => {
          console.log(removeItem(id));
        });

      grocery
        .command("clear")
        .description("Clear all bought items")
        .action(() => {
          console.log(clearBoughtItems());
        });
    },
    { commands: ["grocery"] }
  );

  // Register tool for Claude to use
  api.registerTool({
    name: "grocery_list",
    description: "Manage grocery shopping list using dstask. Add items, list pending items, mark as bought, or clear completed items.",
    parameters: {
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
    handler: async ({ action, item, id }: any, { respond }: any) => {
      try {
        let result: string;

        switch (action) {
          case "list":
            const items = listGroceries();
            result =
              items.length === 0
                ? "Grocery list is empty"
                : `Grocery list:\n${items.map((i) => `${i.id}. ${i.summary}`).join("\n")}`;
            break;

          case "add":
            if (!item) throw new Error("Item description is required for 'add' action");
            result = addGroceryItem(item);
            break;

          case "done":
            if (!id) throw new Error("Item ID is required for 'done' action");
            result = markAsBought(id);
            break;

          case "remove":
            if (!id) throw new Error("Item ID is required for 'remove' action");
            result = removeItem(id);
            break;

          case "clear":
            result = clearBoughtItems();
            break;

          default:
            throw new Error(`Unknown action: ${action}`);
        }

        respond(true, { ok: true, result });
      } catch (error: any) {
        respond(false, { ok: false, error: error.message });
      }
    },
  });

  // Register Gateway RPC methods
  api.registerGatewayMethod("grocery.list", async () => {
    const items = listGroceries();
    return { ok: true, items };
  });

  api.registerGatewayMethod("grocery.add", async ({ item }: { item: string }) => {
    const result = addGroceryItem(item);
    return { ok: true, message: result };
  });

  api.registerGatewayMethod("grocery.done", async ({ id }: { id: string }) => {
    const result = markAsBought(id);
    return { ok: true, message: result };
  });
}
