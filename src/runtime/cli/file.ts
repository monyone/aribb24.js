const bunWriteFS = async (path: string, data: ArrayBuffer | string): Promise<void> => {
  const bun = (globalThis as any).Bun;
  await bun.write(path, data);
}

const encoder = new TextEncoder();
const denoWriteFS = async (path: string, data: ArrayBuffer | string): Promise<void> => {
  const deno = (globalThis as any).Deno;
  await deno.writeFile(path, typeof data === 'string' ? encoder.encode(data) : data);
}

const nodeWriteFS = async (path: string, data: ArrayBuffer | string): Promise<void> => {
  const Buffer = (globalThis as any).Buffer;
  const process = (globalThis as any).process;
  if (path === '-') {
    process.stdout.write(Buffer.from(data));
  } else {
    const fs = await import('node:fs/promises');
    await fs.writeFile(path, Buffer.from(data));
  }
}

export const writeFS = async (path: string, data: ArrayBuffer | string): Promise<void> => {
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

