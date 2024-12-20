const bunReadableStreamFS = (path: string): ReadableStream<Uint8Array> => {
  const bun = (globalThis as any).Bun;
  if (path === '-') {
    return bun.stdin.stream();
  }

  const file = bun.file(path);
  return file.stream();
}

const denoReadableStreamFS = (path: string): ReadableStream<Uint8Array> => {
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

  const node = await import('node:fs');
  return (ReadableStream as any).from(node.createReadStream(path));
}

const bunWritableStreamFS = (path: string): WritableStream<Uint8Array> => {
  const bun = (globalThis as any).Bun;
  if (path === '-') {
    return bun.stdout.stream();
  }

  const file = bun.file(path);
  const writer = file.writer();
  return new WritableStream<Uint8Array>({
    write(chunk) {
      writer.write(chunk);
    },
    close() {
      writer.end();
    }
  });
}

const denoWritableStreamFS = (path: string): WritableStream<Uint8Array> => {
  const deno = (globalThis as any).Deno;
  if (path === '-') {
    return deno.stdout.writable;
  }

  const file = deno.open(path, { create: true });
  return file.writable;
}

const nodeWritableStreamFS = async (path: string): Promise<WritableStream<Uint8Array>> => {
  if (path === '-') {
    return new WritableStream<Uint8Array>({
      write(chunk) {
        process.stdout.write(chunk);
      },
    })
  }

  const node = await import('node:fs');
  const stream = node.createWriteStream(path)
  return new WritableStream<Uint8Array>({
    write(chunk) {
      stream.write(chunk);
    },
    close() {
      stream.close();
    }
  });
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

export const writableStream = async (path: string): Promise<WritableStream<Uint8Array>> => {
  if ((globalThis as any).Deno) {
    return denoWritableStreamFS(path);
  } else if ((globalThis as any).Bun) {
    return bunWritableStreamFS(path);
  } else if ((globalThis as any).process?.release?.name === 'node') {
    return nodeWritableStreamFS(path);
  } else {
    throw new Error('UnSupported Runtime!');
  }
}

