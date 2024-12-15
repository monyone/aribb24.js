import { UnreachableError } from "../../util/error";

const nodeOrBunExit = (code: number = 0): never => {
  const process = (globalThis as any).process;
  process.exit(code);
  throw new UnreachableError('Not Reachable');
}

const denoExit = (code: number = 0): never => {
  const deno = (globalThis as any).Deno;
  deno.exit(code);
  throw new UnreachableError('Not Reachable');
}

export const exit = (code: number = 0): never => {
  if ((globalThis as any).Deno) {
    return denoExit(code);
  } else if ((globalThis as any).Bun) {
    return nodeOrBunExit(code);
  } else if ((globalThis as any).process?.release?.name === 'node') {
    return nodeOrBunExit(code);
  } else {
    throw new Error('UnSupported Runtime!');
  }
}

