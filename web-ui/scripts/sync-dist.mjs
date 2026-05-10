import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

await mkdir(dist, { recursive: true });
await cp(path.join(root, "index.html"), path.join(dist, "index.html"));

for (const dir of ["css", "js", "assets"]) {
  const source = path.join(root, dir);
  const target = path.join(dist, dir);
  try {
    await rm(target, { recursive: true, force: true });
    await cp(source, target, { recursive: true, force: true });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
