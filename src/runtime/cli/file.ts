const bunWriteFS = async (path: string, data: ArrayBufferLike | string): Promise<void> => {
  const bun = (globalThis as any).Bun;
  await bun.write(path === '-' ? bun.stdout : path, data);
}

const denoWriteFS = async (path: string, data: ArrayBufferLike | string): Promise<void> => {
  const encoder = new TextEncoder();
  const deno = (globalThis as any).Deno;
  const bytes = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data);
  if (path === '-') {
    let written = 0;
    while (written < bytes.byteLength) {
      written += await deno.stdout.write(bytes.subarray(written));
    }
  } else {
    await deno.writeFile(path, bytes);
  }
}

const nodeWriteFS = async (path: string, data: ArrayBufferLike | string): Promise<void> => {
  const Buffer = (globalThis as any).Buffer;
  const process = (globalThis as any).process;
  if (path === '-') {
    process.stdout.write(Buffer.from(data));
  } else {
    const fs = await import('node:fs/promises');
    await fs.writeFile(path, Buffer.from(data));
  }
}

export const writeFS = async (path: string, data: ArrayBufferLike | string): Promise<void> => {
  if ((globalThis as any).Deno) {
    return denoWriteFS(path, data);
  } else if ((globalThis as any).Bun) {
    return bunWriteFS(path, data);
  } else if ((globalThis as any).process?.release?.name === 'node') {
    return nodeWriteFS(path, data);
  } else {
    throw new Error('UnSupported Runtime!');
  }
}

