import { spawn } from "node:child_process";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const input = JSON.parse(Buffer.concat(chunks).toString());
const filePath = input.tool_input?.file_path;
const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

if (!filePath || !EXTENSIONS.test(filePath)) process.exit(0);

const child = spawn(
  "npx",
  ["prettier", "--write", "--log-level=error", filePath],
  {
    cwd: "D:/workspace/ok2020/village/backend",
    stdio: "inherit",
    shell: true,
  },
);

child.on("close", () => process.exit(0));
child.on("error", () => process.exit(0));
