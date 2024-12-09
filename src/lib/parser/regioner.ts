import { ARIBB24_CHARACTER_SIZE, ARIBB24CharacterParsedToken, ARIBB24DRCSPrasedToken, ARIBB24ParsedToken, ARIBB24Parser } from "./parser";

export type ARIBB24Region = {
  position: [number, number],
  area: [number, number];
  size: (typeof ARIBB24_CHARACTER_SIZE)[keyof typeof ARIBB24_CHARACTER_SIZE],
  background: number;
  highlight: boolean;
  tokens: (ARIBB24CharacterParsedToken | ARIBB24DRCSPrasedToken)[];
};

const charsize_normalize = (size: (typeof ARIBB24_CHARACTER_SIZE)[keyof typeof ARIBB24_CHARACTER_SIZE]) => {
  return size === 'Middle' ? 'Normal' : size;
};

export default (tokens: ARIBB24ParsedToken[]): ARIBB24Region[] => {
  const characters = tokens.filter((token) => token.tag === 'Character' || token.tag === 'DRCS').toSorted((token1, token2) => {
    if (token1.state.position[1] !== token2.state.position[1]) {
      return Math.sign(token1.state.position[1] - token1.state.position[1]);
    } else {
      return Math.sign(token1.state.position[0] - token1.state.position[0]);
    }
  });

  const regions: ARIBB24Region[] = [];
  for (const character of characters) {
    const region = regions.find((region) => {
      const rx = region.position[0] + region.area[0];
      const ry = region.position[1] + region.area[1];
      const tx = character.state.position[0];
      const ty = character.state.position[1];
      return rx == tx && ry == ty;
    });

    const is_same_background = region != null && (region.background === character.state.background);
    const is_same_highlight = region != null && region.highlight === (character.state.highlight !== 0);
    const is_same_charsize = region != null && (charsize_normalize(region.tokens.at(-1)!.state.size) === charsize_normalize(character.state.size));
    if (!(is_same_background && is_same_highlight && is_same_charsize)) {
      regions.push({
        position: [character.state.position[0], character.state.position[1] - ARIBB24Parser.box(character.state)[1]],
        area: [ARIBB24Parser.box(character.state)[0], ARIBB24Parser.box(character.state)[1]],
        size: charsize_normalize(character.state.size),
        background: character.state.background,
        highlight: character.state.highlight !== 0,
        tokens: [character]
      });
    } else {
      region.area = [region.area[0] + ARIBB24Parser.box(character.state)[0], region.area[1]]
      region.tokens.push(character);
    }
  }

  return regions;
}
