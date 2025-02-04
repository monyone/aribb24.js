export function binaryToPercentString(binary: Uint8Array, begin: number, end: number): string {
  let result = '';
  for (let i = begin; i < end; i++) {
    result += `%${binary[i].toString(16).padStart(2, '0')}`;
  }
  return result;
}

export function binaryUTF8ToString(binary: Uint8Array, begin: number, end: number): string {
  if (TextDecoder) {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const array: Uint8Array = new Uint8Array(binary.slice(begin, end));

    return decoder.decode(array);
  } else {
    return decodeURIComponent(binaryToPercentString(binary, begin, end));
  }
}

export function binaryISO85591ToString(binary: Uint8Array, begin: number, end: number): string {
  if (TextDecoder) {
    const decoder = new TextDecoder('iso-8859-1', { fatal: true });
    const array: Uint8Array = new Uint8Array(binary.slice(begin, end));

    return decoder.decode(array);
  } else {
    return unescape(binaryToPercentString(binary, begin, end));
  }
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const result = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) { result[i] = binary.charCodeAt(i); }
  return result;
}

export function uint8ArrayToBase64(uint8: Uint8Array): string {
  let result = '';
  for (const elem of uint8) {
    result += String.fromCharCode(elem);
  }
  return btoa(result);
}
