// PostToolUse hook: run Prettier on the file Claude just edited.
import { execFileSync } from 'node:child_process';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const file = JSON.parse(input).tool_input?.file_path;
if (file && /\.(html|css|js|mjs|json|md)$/.test(file)) {
  try {
    execFileSync('npx', ['prettier', '--write', '--ignore-unknown', file], { stdio: 'ignore' });
  } catch {
    // Formatting is best-effort; never block the edit.
  }
}
