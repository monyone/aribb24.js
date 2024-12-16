import { UnreachableError } from "../../util/error";
import { exit } from "./exit";

const bunArgs = (): string[] => {
  const bun = (globalThis as any).Bun;
  return bun.argv;
}

const denoArgs = (): string[] => {
  const deno = (globalThis as any).Deno;
  return deno.args;
}

const nodeArgs = (): string[] => {
  return process.argv;
}

export const args = (): string[] => {
  if ((globalThis as any).Deno) {
    return denoArgs();
  } else if ((globalThis as any).Bun) {
    return bunArgs();
  } else if ((globalThis as any).process?.release?.name === 'node') {
    return nodeArgs();
  } else {
    throw new Error('UnSupported Runtime!');
  }
}

type Action = 'default' | 'store_true' | 'help';

export type ArgsOption = {
  long: string;
  short?: string;
  help: string;
  action: Action;
}

export const parseArgs = (args: string[], options: ArgsOption[], title?: string, description?: string): Record<string, any> => {
  const result: Record<string, any> = {};

  for (let i = 0; i < args.length; i++) {
    const target = options.find((option) => {
      if (args[i] === option.long) { return true; }
      if (args[i] === option.short) { return true; }
      return false;
    });
    if (target == null) { continue; }

    const key = target.long.replace(/^-*/, '');
    switch (target.action) {
      case 'default': {
        const value = args[i + 1];
        result[key] = value;
        i++;
        continue;
      }
      case 'store_true': {
        result[key] = true;
        continue;
      }
      case 'help': {
        if (title) {
          if (description) {
            console.error(`${title}: ${description}`);
          } else {
            console.error(`${title}`);
          }
        }
        for (const option of options) {
          console.error(`${title ? ' ' : ''}${option.long}: ${option.help}`);
        }
        exit(0);
        throw new UnreachableError('Not Reachable');
      }
    }
  }

  return result;
}

