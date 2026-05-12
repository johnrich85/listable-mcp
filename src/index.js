#!/usr/bin/env node

const ENDPOINT = process.env.LISTABLE_MCP_URL || 'https://listable.directory/api/v1/external/mcp';
const TOKEN = process.env.LISTABLE_API_TOKEN;

if (!TOKEN) {
  process.stderr.write(
    'listable-mcp: LISTABLE_API_TOKEN env var is required.\n' +
    'Create a key at https://listable.directory/my-account/api-keys\n'
  );
  process.exit(1);
}

let buffer = '';
let inFlight = 0;
let stdinClosed = false;

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);
    if (line) {
      inFlight++;
      forward(line).finally(() => {
        inFlight--;
        if (stdinClosed && inFlight === 0) process.exit(0);
      });
    }
  }
});

process.stdin.on('end', () => {
  stdinClosed = true;
  if (inFlight === 0) process.exit(0);
});

async function forward(line) {
  let message;
  try {
    message = JSON.parse(line);
  } catch (err) {
    process.stderr.write(`listable-mcp: malformed JSON from client: ${err.message}\n`);
    return;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (res.status === 202) return;

    const text = await res.text();
    if (!text) return;

    process.stdout.write(text.replace(/\n+$/, '') + '\n');
  } catch (err) {
    if (message.id === undefined) return;
    const errorResponse = {
      jsonrpc: '2.0',
      id: message.id ?? null,
      error: {
        code: -32603,
        message: `listable-mcp transport error: ${err.message}`,
      },
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
}
