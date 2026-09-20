import { spawn } from "node:child_process";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

const port = process.env.PORT || "43127";
const host = process.env.HOST || "0.0.0.0";

await run("npx", ["prisma", "migrate", "deploy"]);
await run("npx", ["next", "start", "-H", host, "-p", String(port)]);
