import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function run(label: string, cmd: string) {
  console.log(`\n▶ ${label}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit", env: { ...process.env } });
}

run("Collecting posts", "npx tsx scripts/collect_posts.ts");
run("Scoring & filtering", "npx tsx scripts/score_posts.ts");
run("Rendering digest", "npx tsx scripts/render_digest.ts");

if (process.env.NOTION_API_KEY) {
  run("Syncing to Notion", "npx tsx scripts/sync_to_notion.ts");
} else {
  console.log("\n⚠ Skipping Notion sync — NOTION_API_KEY not set.");
}

console.log("\n✓ Pipeline complete.");
