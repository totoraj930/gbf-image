import {
  HSV,
  Rect,
  detectRect,
  inRange,
  inRangeHsv,
  rgbaArrayToHsvArray,
} from '../utils';

export type TaskMessage = {
  imageData: ImageData;
  id: string;
};
export type ResultMessage = {
  data: {
    characterPos: Rect;
    isCharacter: boolean;
    lineData: boolean[];
  };
  id: string;
};

self.addEventListener('message', (msg) => {
  const data = msg.data as TaskMessage;
  const hsv = rgbaArrayToHsvArray(data.imageData.data);
  const { width: w, height: h } = data.imageData;
  const res = getCharacterPos(hsv, w, h);
  const resMsg: ResultMessage = {
    data: res,
    id: data.id,
  };
  self.postMessage(resMsg);
});

export default {};

export function getCharacterPos(hsvData: HSV[], w: number, h: number) {
  const lineData = hsvData.map((hsv) => {
    return hsv.v > 0.5 && inRange(hsv.h, 170, 194);
  });
  const rawRects = detectRect(lineData, w, h);
  const rects = rawRects
    .filter(({ w, h }) => {
      return w > 100 && inRange(w / h, 1.7, 1.75);
    })
    .sort((a, b) => a.x - b.x);
  const characterPos = rects[0];
  const isCharacter = !!characterPos;
  return {
    characterPos,
    isCharacter,
    lineData,
  };
}

export function getCharacterPos2(hsvData: HSV[], w: number, h: number) {
  const extraBackPos = {
    x: 9999,
    y: 9999,
  };
  let isCharacter = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = w * y + x;
      const isExtraBack = inRangeHsv(
        hsvData[n],
        { h: 246, s: 0.53, v: 0.36 },
        0.97
      );
      if (
        isExtraBack &&
        extraBackPos.x > x &&
        (extraBackPos.y === 9999 || Math.abs(extraBackPos.y - y) < 10)
      ) {
        extraBackPos.x = x;
        extraBackPos.y = y;
      }
    }
  }
  let lineY = extraBackPos.y + 50;
  for (let y = lineY; y < h; y++) {
    const n = w * y + extraBackPos.x;
    const isLine =
      inRange(hsvData[n].h, 180, 190) && inRange(hsvData[n].v, 0.99, 1);
    if (isLine) {
      lineY = y;
      isCharacter = true;
      break;
    }
  }
  const ratio = (lineY - extraBackPos.y) / 197;
  const characterPos = {
    x: Math.round(extraBackPos.x - 380 * ratio),
    y: Math.round(extraBackPos.y + 196 * ratio),
    w: Math.round(570 * ratio),
    h: Math.round(332 * ratio),
  };
  return {
    extraBackPos,
    lineY,
    characterPos,
    isCharacter,
  };
}
