import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function migrate(attempt = 1) {
  try {
    await run(process.execPath, [prismaCli, "migrate", "deploy"]);
  } catch (error) {
    if (attempt < 5) {
      console.warn(`Prisma migrate failed (attempt ${attempt}/5), retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return migrate(attempt + 1);
    }
    throw error;
  }
}

const port = process.env.PORT || "43127";
const host = process.env.HOST || "0.0.0.0";

await migrate();
await run(process.execPath, [nextCli, "start", "-H", host, "-p", String(port)]);
