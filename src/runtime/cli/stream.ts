const bunReadableStreamFS = async (path: string): Promise<ReadableStream<Uint8Array>> => {
  const bun = (globalThis as any).Bun;
  if (path === '-') {
    return bun.stdin.stream();
  }

  const file = bun.file(path);
  return file.stream();
}

const denoReadableStreamFS = (path: string): Promise<ReadableStream<Uint8Array>> => {
  const deno = (globalThis as any).Deno;
  if (path === '-') {
    return deno.stdin.readable;
  }

  const file = deno.open(path, { read: true });
  return file.readable;
}

const nodeReadableStreamFS = async (path: string): Promise<ReadableStream<Uint8Array>> => {
  if (path === '-') {
    return (ReadableStream as any).from((globalThis as any).process.stdin);
  }

  // @ts-ignore
  const node = await import('node:fs');
  return (ReadableStream as any).from(node.createReadStream(path));
}

export const readableStream = async (path: string): Promise<ReadableStream<Uint8Array>> => {
  if ((globalThis as any).Deno) {
    return denoReadableStreamFS(path);
  } else if ((globalThis as any).Bun) {
    return bunReadableStreamFS(path);
  } else if ((globalThis as any).process?.release?.name === 'node') {
    return nodeReadableStreamFS(path);
  } else {
    throw new Error('UnSupported Runtime!');
  }
}

