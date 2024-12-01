import CRC32 from "../../util/crc32";
import { ARIBB24Token, ARIBB24BitmapToken } from "../../lib/tokenizer/token";
import { replaceDRCS as tokenizerReplaceDRCS } from "../../lib/tokenizer/b24/tokenizer";
import { ARIBB24CommonParsedToken, ARIBB24ParsedToken, ARIBB24Parser, ARIBB24ParserOption, ARIBB24ParserState } from "../../lib/parser/parser";

export type DecodedBitmap = {
  tag: 'Bitmap';
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  normal_dataurl: string;
  normal_bitmap: ImageBitmap;
  flashing_dataurl?: string;
  flashing_bitmap?: ImageBitmap;
};
export const DecodedBitmap = {
  async from(bitmap: ARIBB24BitmapToken, pallet: string[]): Promise<DecodedBitmap> {
    const uint8 = new Uint8Array(bitmap.binary);
    const flcColors = new Set(bitmap.flc_colors);

    const pngHeaderSize = 8 /* PNG signature */ + 4 /* size */ + 4 /* 'IHDR' */ + 13 /* IHDR */ + 4 /* CRC32 */;
    const ihdr = uint8.subarray(0, pngHeaderSize);
    const idat = uint8.subarray(pngHeaderSize, uint8.byteLength);
    const plteDataSize = 128 * 3;
    const trnsDataSize = 128;
    const plteSize = plteDataSize + 12 /* 'PLTE' + size + CRC32 */;
    const trnsSize = trnsDataSize + 12 /* 'tRNS' + size + CRC32 */;
    const plteOffset = pngHeaderSize;
    const trnsOffset = pngHeaderSize + plteSize;

    const pngData = new Uint8Array(ihdr.byteLength + idat.byteLength + plteSize + trnsSize);
    const pngDataView = new DataView(pngData.buffer);
    pngData.set(ihdr, 0);
    pngData.set(idat, pngHeaderSize + plteSize + trnsSize);

    for (let i = 0; i < pallet.length; i++) {
      const color = pallet[i];
      const R = Number.parseInt(color.substring(1, 3), 16);
      const G = Number.parseInt(color.substring(3, 5), 16);
      const B = Number.parseInt(color.substring(5, 7), 16);
      const A = Number.parseInt(color.substring(7, 9), 16);
      pngData[plteOffset + 8 + i * 3 + 0] = R;
      pngData[plteOffset + 8 + i * 3 + 1] = G;
      pngData[plteOffset + 8 + i * 3 + 2] = B;
      pngData[trnsOffset + 8 + i] = flcColors.has(i) ? 0 : A;
    }
    pngDataView.setInt32(plteOffset, plteDataSize, false);
    pngData[plteOffset + 4] = 'P'.charCodeAt(0);
    pngData[plteOffset + 5] = 'L'.charCodeAt(0);
    pngData[plteOffset + 6] = 'T'.charCodeAt(0);
    pngData[plteOffset + 7] = 'E'.charCodeAt(0);
    pngDataView.setInt32(trnsOffset, trnsDataSize, false);
    pngData[trnsOffset + 4] = 't'.charCodeAt(0);
    pngData[trnsOffset + 5] = 'R'.charCodeAt(0);
    pngData[trnsOffset + 6] = 'N'.charCodeAt(0);
    pngData[trnsOffset + 7] = 'S'.charCodeAt(0);
    pngDataView.setInt32(plteOffset + plteSize - 4, CRC32(pngData, plteOffset + 4, plteOffset + 8 + plteDataSize), false);
    pngDataView.setInt32(trnsOffset + trnsSize - 4, CRC32(pngData, trnsOffset + 4, trnsOffset + 8 + trnsDataSize), false);
    const width = pngDataView.getInt32(16 /* PNG signature + 'IHDR' + size */, false);
    const height = pngDataView.getInt32(20 /* PNG signature + 'IHDR' + size + width */, false);
    const normalImage = new Image(width, height);
    normalImage.src = 'data:image/png;base64,' + btoa(String.fromCharCode(...pngData));
    await normalImage.decode();
    const normal_bitmap = await createImageBitmap(normalImage);

    if (flcColors.size === 0) {
      return {
        tag: 'Bitmap',
        x_position: bitmap.x_position,
        y_position: bitmap.y_position,
        width,
        height,
        normal_dataurl: normalImage.src,
        normal_bitmap
      };
    }

    // Flashing
    for (let i = 0; i < pallet.length; i++) {
      const color = pallet[i];
      const A = Number.parseInt(color.substring(7, 9), 16);
      pngData[trnsOffset + 8 + i] = !flcColors.has(i) ? 0 : A;
    }
    pngDataView.setInt32(plteOffset + plteSize - 4, CRC32(pngData, plteOffset + 4, plteOffset + 8 + plteDataSize), false);
    pngDataView.setInt32(trnsOffset + trnsSize - 4, CRC32(pngData, trnsOffset + 4, trnsOffset + 8 + trnsDataSize), false);

    const flashingImage = new Image(width, height);
    flashingImage.src = 'data:image/png;base64,' + btoa(String.fromCharCode(...pngData));
    await flashingImage.decode();
    const flashing_bitmap = await createImageBitmap(flashingImage);

    return {
      tag: 'Bitmap',
      x_position: bitmap.x_position,
      y_position: bitmap.y_position,
      width,
      height,
      normal_dataurl: normalImage.src,
      normal_bitmap,
      flashing_dataurl: flashingImage.src,
      flashing_bitmap,
    };
  }
};

export type ARIBB24BrowserToken = Exclude<ARIBB24Token, ARIBB24BitmapToken> | DecodedBitmap;

export type ARIBB24BitmapParsedToken = ARIBB24CommonParsedToken & Omit<DecodedBitmap, 'tag'> & {
  tag: 'Bitmap';
};
export const ARIBB24BitmapParsedToken = {
  from(bitmap: DecodedBitmap, state: ARIBB24ParserState, option: ARIBB24ParserOption): ARIBB24BitmapParsedToken {
    return {
      tag: 'Bitmap',
      state,
      option,
      x_position: bitmap.x_position * option.magnification,
      y_position: bitmap.y_position * option.magnification,
      width: bitmap.width * option.magnification,
      height: bitmap.height * option.magnification,
      normal_dataurl: bitmap.normal_dataurl,
      normal_bitmap: bitmap.normal_bitmap,
      flashing_dataurl: bitmap.flashing_dataurl,
      flashing_bitmap: bitmap.flashing_bitmap,
    };
  }
}

export type ARIBB24BrowserParsedToken = ARIBB24ParsedToken | ARIBB24BitmapParsedToken;

export const toBrowserTokenWithBitmap = async (tokens: ARIBB24Token[], pallet: string[]): Promise<ARIBB24BrowserToken[]> => {
  let result: ARIBB24BrowserToken[] = [];
  for (const token of tokens) {
    if (token.tag !== 'Bitmap') {
      result.push(token);
      continue;
    }

    result.push(await DecodedBitmap.from(token, pallet));
  }

  return result;
}

export const toBrowserTokenWithoutBitmap = (tokens: ARIBB24Token[]): ARIBB24BrowserToken[] => {
  return tokens.filter((token) => token.tag !== 'Bitmap');
}

export class ARIBB24BrowserParser {
  private praser: ARIBB24Parser;

  public constructor(state?: Readonly<ARIBB24ParserState>, option?: ARIBB24ParserOption) {
    this.praser = new ARIBB24Parser(state, option);
  }

  private parseBitmapOrInherit(token: ARIBB24BrowserToken): ARIBB24BrowserParsedToken[] {
    if (token.tag !== 'Bitmap') { return this.praser.parseToken(token as ARIBB24Token); }
    return [ARIBB24BitmapParsedToken.from(token, this.praser.currentState(), this.praser.currentOption())];
  }

  public parse(tokens: ARIBB24BrowserToken[]): ARIBB24BrowserParsedToken[] {
    return tokens.flatMap(this.parseBitmapOrInherit.bind(this));
  }
}

export const replaceDRCS = (tokens: ARIBB24BrowserToken[], replace: Map<string, string>): ARIBB24BrowserToken[] => {
  return tokenizerReplaceDRCS(tokens as ARIBB24Token[], replace) as ARIBB24BrowserToken[];
}
