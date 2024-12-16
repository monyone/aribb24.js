const bunWriteFS = async (path: string, data: ArrayBuffer): Promise<void> => {
  const bun = (globalThis as any).Bun;
  bun.write(path, data);
}

const denoWriteFS = async (path: string, data: ArrayBuffer): Promise<void> => {
  const deno = (globalThis as any).Deno;
  deno.writeFile(path, data);
}

const nodeWriteFS = async (path: string, data: ArrayBuffer): Promise<void> => {
  const Buffer = (globalThis as any).Buffer;
  const process = (globalThis as any).process;
  if (path === '-') {
    process.stdout.write(Buffer.from(data));
  } else {
    const fs = await import('node:fs');
    fs.writeFileSync(path, Buffer.from(data));
  }
}

export const writeFS = async (path: string, data: ArrayBuffer): Promise<void> => {
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

