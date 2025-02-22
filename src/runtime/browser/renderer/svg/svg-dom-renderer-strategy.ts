
import { CaptionAssociationInformation } from "../../../../lib/demuxer/b24/datagroup";
import { SVGDOMRendererOption } from "./svg-dom-renderer-option";
import { ARIBB24BrowserParser, ARIBB24BrowserToken } from "../../types";
import { ARIBB24ParserState } from "../../../../lib/parser/parser";
import rendererStrategy, { SVGNode } from "../../../common/renderer/svg/renderer-strategy";

const toSVGElement = (node: SVGNode) => {
  if (typeof node === 'string') {
    return document.createTextNode(node);
  }

  const elem = document.createElementNS(node.xmlns, node.name);
  for (const [k, v] of Object.entries(node.attributes)) {
    elem.setAttribute(k, v);
  }
  for (const child of node.children) {
    elem.appendChild(toSVGElement(child));
  }
  return elem;
}

export default (target: SVGSVGElement, state: ARIBB24ParserState, tokens: ARIBB24BrowserToken[], info: CaptionAssociationInformation, rendererOption: SVGDOMRendererOption): void => {
  const parser = new ARIBB24BrowserParser(state);
  const parsedTokens = parser.parse(tokens);
  const omittedParedTokens = parsedTokens.filter((token) => token.tag !== 'Bitmap');
  const bitmapParsedTokens = parsedTokens.filter((token) => token.tag === 'Bitmap');

  const clearScreen = parsedTokens.find((token) => token.tag === 'ClearScreen');
  if (clearScreen && clearScreen.time === 0) {
    while (target.lastChild != null) {
      target.removeChild(target.lastChild);
    }
  }

  const buffer = rendererStrategy(omittedParedTokens, info, rendererOption);
  for (const bitmap of bitmapParsedTokens) {
    {
      const image = SVGNode.from('http://www.w3.org/2000/svg', 'image');
      image.attributes['href'] = bitmap.normal_dataurl;
      image.attributes['x'] =`${bitmap.x_position}`;
      image.attributes['y'] = `${bitmap.y_position}`;
      image.attributes['width'] = `${bitmap.width}`;
      image.attributes['height'] = `${bitmap.height}`;

      buffer.children.push(image);
    }
    if (bitmap.flashing_dataurl != null) {
      const flcImage = SVGNode.from('http://www.w3.org/2000/svg', 'image');
      flcImage.attributes['href'] = bitmap.flashing_dataurl;
      flcImage.attributes['x'] =`${bitmap.x_position}`;
      flcImage.attributes['y'] = `${bitmap.y_position}`;
      flcImage.attributes['width'] =`${bitmap.width}`;
      flcImage.attributes['height'] = `${bitmap.height}`;

      const animate = SVGNode.from('http://www.w3.org/2000/svg', 'animate');
      animate.attributes['attributeName'] = 'opacity';
      animate.attributes['values'] = '1;0';
      animate.attributes['dur'] = '1s';
      animate.attributes['calcMode'] = 'discrete';
      animate.attributes['repeatCount'] = 'indefinite';
      flcImage.children.push(animate);

      buffer.children.push(flcImage);
    }
  }

  // Fragment append
  const inner = toSVGElement(buffer) as SVGElement;
  inner.style.visibility = 'hidden';
  target.setAttribute('viewBox', `0 0 ${parser.currentState().plane[0]} ${parser.currentState().plane[1]}`);
  target.appendChild(inner);

  // Calc textSize
  for (const text of Array.from(target.getElementsByTagNameNS('http://www.w3.org/2000/svg', 'text'))) {
    const width = (text as SVGTextElement).getComputedTextLength()
    text.setAttribute('textLength', `${Math.min(width, Number.parseInt(text.dataset.width!, 10))}`);
    delete text.dataset.width;
    text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
  }
  // Animation Start
  for (const animate of Array.from(target.getElementsByTagNameNS('http://www.w3.org/2000/svg', 'animate'))) {
    (animate as SVGAnimateElement).beginElement();
  }
  inner.style.visibility = 'visible';
}
