import "dotenv/config";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Client, isFullPage } from "@notionhq/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Splits markdown into Notion-compatible paragraph blocks (max 2000 chars each)
function markdownToBlocks(md: string) {
  const lines = md.split("\n");
  const blocks: object[] = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      blocks.push({ object: "block", type: "heading_1", heading_1: { rich_text: [{ type: "text", text: { content: line.slice(2) } }] } });
    } else if (line.startsWith("## ")) {
      blocks.push({ object: "block", type: "heading_2", heading_2: { rich_text: [{ type: "text", text: { content: line.slice(3) } }] } });
    } else if (line.startsWith("### ")) {
      blocks.push({ object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: line.slice(4) } }] } });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      blocks.push({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", text: { content: line.slice(2) } }] } });
    } else if (/^\d+\. /.test(line)) {
      blocks.push({ object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: [{ type: "text", text: { content: line.replace(/^\d+\. /, "") } }] } });
    } else if (line.startsWith(">")) {
      blocks.push({ object: "block", type: "quote", quote: { rich_text: [{ type: "text", text: { content: line.slice(1).trim() } }] } });
    } else if (line.trim() === "") {
      // skip empty lines
    } else {
      const content = line.slice(0, 2000);
      blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content } }] } });
    }
  }

  return blocks;
}

async function main() {
  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const parentId = process.env.NOTION_DATABASE_ID ?? process.env.NOTION_PAGE_ID;

  if (!parentId) {
    throw new Error("Set NOTION_DATABASE_ID or NOTION_PAGE_ID in .env");
  }

  const date = today();
  const digestPath = join(ROOT, "data", "digests", `${date}.md`);
  const content = readFileSync(digestPath, "utf-8");

  const title = `Japanese AI Tool Digest — ${date}`;
  const blocks = markdownToBlocks(content);

  // Determine if parent is a database or page
  let parentObj: { database_id: string } | { page_id: string };
  try {
    const db = await notion.databases.retrieve({ database_id: parentId });
    parentObj = { database_id: parentId };
  } catch {
    parentObj = { page_id: parentId };
  }

  const page = await notion.pages.create({
    parent: parentObj,
    properties: {
      title: { title: [{ type: "text", text: { content: title } }] },
    },
    children: blocks.slice(0, 100) as Parameters<typeof notion.pages.create>[0]["children"],
  });

  console.log(`✓ Posted to Notion → ${(page as { url: string }).url}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
