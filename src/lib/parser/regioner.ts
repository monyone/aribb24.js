import { CaptionAssociationInformation } from "../demuxer/b24/datagroup";
import { ARIBB24_CHARACTER_SIZE, ARIBB24CharacterParsedToken, ARIBB24DRCSParsedToken, ARIBB24ParsedToken, ARIBB24Parser } from "./parser";


export type ARIBB24ScriptParsedToken = {
  tag: 'Script';
  sup: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken;
  sub: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken;
}
export const ARIBB24ScriptParsedToken = {
  from(sup: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken, sub: ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken): ARIBB24ScriptParsedToken {
    return {
      tag: 'Script',
      sup,
      sub,
    };
  }
}
export type ARIBB24RegionerToken = ARIBB24CharacterParsedToken | ARIBB24DRCSParsedToken | ARIBB24ScriptParsedToken;

export type ARIBB24NormalSpan = {
  tag: 'Normal';
  text: ARIBB24RegionerToken[];
};
export const ARIBB24NormalSpan = {
  from(text: ARIBB24RegionerToken[]): ARIBB24NormalSpan {
    return { tag: 'Normal', text };
  }
};
export type ARIBB24RubySpan = {
  tag: 'Ruby';
  text: ARIBB24RegionerToken[];
  ruby: ARIBB24RegionerToken[];
};
export const ARIBB24RubySpan = {
  from(text: ARIBB24RegionerToken[], ruby: ARIBB24RegionerToken[]): ARIBB24RubySpan {
    return { tag: 'Ruby', text, ruby };
  }
};
export type ARIBB24Span = ARIBB24NormalSpan | ARIBB24RubySpan;

export type ARIBB24Region = {
  plane: [number, number],
  margin: [number, number],
  position: [number, number],
  area: [number, number];
  size: (typeof ARIBB24_CHARACTER_SIZE)[keyof typeof ARIBB24_CHARACTER_SIZE],
  background: number;
  highlight: boolean;
  spans: ARIBB24Span[];
};

const charsize_normalize = (size: (typeof ARIBB24_CHARACTER_SIZE)[keyof typeof ARIBB24_CHARACTER_SIZE]) => {
  return size === 'Middle' ? 'Normal' : size;
};

export const SSZ_RUBY_DETECTION = {
  GUESS: 'GUESS_RUBY',
  PRESERVE: 'PRESERVE',
  IGNORE: 'IGNORE',
} as const;

export default (tokens: ARIBB24ParsedToken[], info: CaptionAssociationInformation, ruby_handle_type: (typeof SSZ_RUBY_DETECTION)[keyof typeof SSZ_RUBY_DETECTION]): ARIBB24Region[] => {
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
      const ry = region.position[1];
      const tx = character.state.position[0];
      const ty = character.state.position[1] - (ARIBB24Parser.box(character.state)[1] - 1);
      return rx == tx && ry == ty;
    });

    const is_same_background = region != null && (region.background === character.state.background);
    const is_same_highlight = region != null && region.highlight === (character.state.highlight !== 0);
    const is_same_charsize = region != null && (charsize_normalize(region.size) === charsize_normalize(character.state.size));
    if (!(is_same_background && is_same_highlight && is_same_charsize)) {
      regions.push({
        plane: [... character.state.plane],
        margin: [... character.state.margin],
        position: [character.state.position[0], character.state.position[1] - (ARIBB24Parser.box(character.state)[1] - 1)],
        area: [ARIBB24Parser.box(character.state)[0], ARIBB24Parser.box(character.state)[1]],
        size: charsize_normalize(character.state.size),
        background: character.state.background,
        highlight: character.state.highlight !== 0,
        spans: [ARIBB24NormalSpan.from([character])],
      });
    } else {
      region.area = [region.area[0] + ARIBB24Parser.box(character.state)[0], region.area[1]]
      region.spans.push(ARIBB24NormalSpan.from([character]));
    }
  }
  for (const { spans } of regions) {
    for (let i = 0; i < spans.length - 1; i++) {
      const curr = spans[i + 0];
      const next = spans[i + 1];
      if (curr.tag !== 'Normal') { continue; }
      if (curr.tag !== next.tag) { continue; }
      curr.text.push(... next.text);
      spans.splice(i + 1, 1);
      i--;
    }
  }

  if (info.association !== 'ARIB') { return regions; }
  // ARIB represent SuperScript/SubScript/Ruby

  // SuperScript/SubScript
  while (true) {
    let update = false;
    LOOP:
    for (const region of regions.filter(({ size }) => size === ARIBB24_CHARACTER_SIZE.Normal)) {
      const r_ex = region.position[0] + region.area[0];
      const r_uy = region.position[1] + 0;
      const r_dy = region.position[1] + region.area[1];

      for (let sup_index = 0; sup_index < regions.length; sup_index++) {
        const sup = regions[sup_index];
        if (sup.size !== ARIBB24_CHARACTER_SIZE.Small) { continue; }
        const sup_x = sup.position[0];
        const sup_y = sup.position[1];
        if (r_ex !== sup_x || r_uy !== sup_y) { continue; }

        for (let sub_index = 0; sub_index < regions.length; sub_index++) {
          if (sub_index === sup_index) { continue; }
          const sub = regions[sub_index];
          if (sub.size !== ARIBB24_CHARACTER_SIZE.Small) { continue; }
          const sub_x = sub.position[0];
          const sub_y = sub.position[1] + sub.area[1];
          if (r_ex !== sub_x || r_dy !== sub_y) { continue; }

          region.area[0] += Math.min(sup.area[0], sub.area[0]);
          const length = Math.min(sup.spans[0].text.length, sub.spans[0].text.length);
          const tokens = [];
          for (let i = 0; i < length; i++) {
            let sup_token = sup.spans.at(0)?.text.at(i) ?? null;
            let sub_token = sub.spans.at(0)?.text.at(i) ?? null;
            if (sup_token == null || sup_token.tag == 'Script') { continue; }
            if (sub_token == null || sub_token.tag == 'Script') { continue; }
            tokens.push(ARIBB24ScriptParsedToken.from(sup_token, sub_token));
          }
          region.spans.push(ARIBB24NormalSpan.from(tokens));
          regions.splice(Math.max(sup_index, sub_index), 1);
          regions.splice(Math.min(sup_index, sub_index), 1);
          update = true;
          break LOOP;
        }
      }
    }
    if (!update) { break; }
  }
  while (true) {
    let update = false;
    LOOP:
    for (let i = 0; i < regions.length; i++) {
      const sx = regions[i].position[0] + regions[i].area[0];
      const s_uy = regions[i].position[1] + 0;
      const s_dy = regions[i].position[1] + regions[i].area[1];

      for (let j = i + 1; j < regions.length; j++) {
        const dx = regions[j].position[0];
        const d_uy = regions[j].position[1] + 0;
        const d_dy = regions[j].position[1] + regions[j].area[1];

        if (sx !== dx || s_uy !== d_uy || s_dy !== d_dy) { continue; }
        regions[i].area[0] += regions[j].area[0];
        regions[i].spans.push(... regions[j].spans);
        regions.splice(j, 1);
        update = true;
        break LOOP;
      }
    }
    if (!update) { break; }
  }

  // Ruby
  if (ruby_handle_type === SSZ_RUBY_DETECTION.GUESS) {
    while (true) {
      let update = false;
      LOOP:
      for (const region of regions.filter(({ size }) => size === ARIBB24_CHARACTER_SIZE.Normal)) {
        const base_sx = region.position[0] + 0;
        const base_dx = region.position[0] + region.area[0];
        const base_uy = region.position[1];

        let max_intersection_index: number | null = null;
        let max_intersection_width: number = 0;
        for (let ruby_index = 0; ruby_index < regions.length; ruby_index++) {
          const ruby = regions[ruby_index];
          if (ruby.size !== ARIBB24_CHARACTER_SIZE.Small) { continue; }
          const ruby_sx = ruby.position[0] + 0;
          const ruby_dx = ruby.position[0] + ruby.area[0];
          const ruby_dy = ruby.position[1] + ruby.area[1];

          if (base_uy !== ruby_dy) { continue; }
          if (base_sx >= ruby_dx || base_dx <= ruby_sx) { continue; }

          const intersection_width = Math.min(base_dx, ruby_dx) - Math.max(base_sx, ruby_sx);
          if (intersection_width > max_intersection_width) {
            max_intersection_width = intersection_width;
            max_intersection_index = ruby_index;
          }
        }

        if (max_intersection_index != null) {
          const ruby = regions[max_intersection_index];
          if (ruby.size !== ARIBB24_CHARACTER_SIZE.Small) { continue; }

          const ruby_sx = ruby.position[0] + 0;
          const ruby_dx = ruby.position[0] + ruby.area[0];

          const characters = region.spans.flatMap((span) => span.text);
          const before_characters = characters.filter((character) => {
            const ch = character.tag === 'Script' ? character.sup : character;
            const sx = ch.state.position[0];
            const dx = ch.state.position[0] + ARIBB24Parser.box(ch.state)[0];
            return dx <= ruby_sx;
          });
          const base_characters = characters.filter((character) => {
            const ch = character.tag === 'Script' ? character.sup : character;
            const sx = ch.state.position[0];
            const dx = ch.state.position[0] + ARIBB24Parser.box(ch.state)[0];
            return ruby_sx < dx && sx < ruby_dx;
          });
          const after_characters = characters.filter((character) => {
            const ch = character.tag === 'Script' ? character.sup : character;
            const sx = ch.state.position[0];
            const dx = ch.state.position[0] + ARIBB24Parser.box(ch.state)[0];
            return ruby_dx <= sx;
          });

          const ruby_characters = ruby.spans.flatMap((span) => span.text);
          region.spans = [ARIBB24NormalSpan.from(before_characters), ARIBB24RubySpan.from(base_characters, ruby_characters), ARIBB24NormalSpan.from(after_characters)];
          regions.splice(max_intersection_index, 1);
          update = true;
          break LOOP;
        }
      }
      if (!update) { break; }
    }
  }

  if (ruby_handle_type === SSZ_RUBY_DETECTION.PRESERVE) {
    return regions;
  } else {
    return regions.filter((region) => region.size !== ARIBB24_CHARACTER_SIZE.Small);
  }
}
