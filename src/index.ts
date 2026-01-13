import { execSync } from "child_process";
import { Type, Static } from "@sinclair/typebox";

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
      env: { ...process.env, PATH: `${process.env.HOME}/go/bin:${process.env.PATH}` },
    }).trim();
  } catch (error: any) {
    throw new Error(`dstask command failed: ${error.message}`);
  }
}

function parseDstaskJson(output: string): DstaskItem[] {
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

// TypeBox schema for the tool parameters
const GroceryParams = Type.Object({
  action: Type.Union([
    Type.Literal("list"),
    Type.Literal("add"),
    Type.Literal("done"),
    Type.Literal("remove"),
    Type.Literal("clear"),
  ], { description: "Action to perform: list (show pending), add (new item), done (mark bought), remove (delete item), clear (remove all bought)" }),
  item: Type.Optional(Type.String({ description: "Item description (for 'add' action)" })),
  id: Type.Optional(Type.String({ description: "Item ID (for 'done' or 'remove' actions)" })),
});

type GroceryParamsType = Static<typeof GroceryParams>;

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

  // Register tool for Claude to use (updated API format)
  api.registerTool({
    name: "grocery_list",
    description: "Manage grocery shopping list using dstask. Add items, list pending items, mark as bought, or clear completed items.",
    parameters: GroceryParams,
    async execute(_id: string, params: GroceryParamsType) {
      const { action, item, id } = params;
      
      try {
        let result: string;

        switch (action) {
          case "list":
            const items = listGroceries();
            result =
              items.length === 0
                ? "🛒 Grocery list is empty"
                : `🛒 Grocery list:\n${items.map((i) => `  ${i.id}. ${i.summary}`).join("\n")}`;
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

        return { content: [{ type: "text", text: result }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
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
