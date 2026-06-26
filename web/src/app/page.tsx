import { readFileSync } from "fs";
import { join } from "path";
import type { WebDigest } from "@/types/digest";
import DigestViewer from "@/app/components/DigestViewer";

function getDigest(): WebDigest {
  const filePath = join(process.cwd(), "public", "data", "latest.json");
  return JSON.parse(readFileSync(filePath, "utf-8")) as WebDigest;
}

export default function Page() {
  const digest = getDigest();
  return <DigestViewer digest={digest} />;
}
