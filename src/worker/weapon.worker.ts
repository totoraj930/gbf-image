import { findPixelData, inRange, inRangeHsv, rgbToHsv } from '../utils';

export type TaskMessage = {
  imageData: ImageData;
  id: string;
};
export type ResultMessage = {
  data: WeaponDetectResult;
  id: string;
};

self.addEventListener('message', (msg) => {
  const data = msg.data as TaskMessage;
  const res = getWeaponPixelData(data.imageData);
  const resMsg: ResultMessage = {
    data: res,
    id: data.id,
  };
  self.postMessage(resMsg);
});

export default {};

export type PixelData = {
  r: number;
  g: number;
  b: number;

  h: number;
  s: number;
  v: number;

  isGreen: boolean;
  isOrange: boolean;
};

export type Pos = {
  x: number;
  y: number;
};
export type PosAndSize = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type WeaponDetectResult = {
  pxData: PixelData[];
  greenPos: Pos;
  orangePos: Pos;
  isWeapon: boolean;
  isDual: boolean;
  isAdditional: boolean;
  isSummon: boolean;
  weaponPos1: PosAndSize;
  weaponPos2: PosAndSize;
  summonPos1: PosAndSize;
  summonPos2: PosAndSize;
  w: number;
  h: number;
};
export function getWeaponPixelData(imageData: ImageData): WeaponDetectResult {
  const { data: uint8Arr, width: w, height: h } = imageData;
  const pxData: PixelData[] = new Array(uint8Arr.length / 4);

  const greenPos = { x: 9999, y: 9999 };
  const orangePos = { x: 9999, y: 9999 };

  for (let i = 0; i < uint8Arr.length; i += 4) {
    const n = i / 4;
    const x = n % w;
    const y = ~~(n / w);
    const hsv = rgbToHsv(uint8Arr[i + 0], uint8Arr[i + 1], uint8Arr[i + 2]);

    const isGreen = inRangeHsv(hsv, { h: 90, s: 0.61, v: 0.99 }, 0.85);
    const isOrange = inRangeHsv(hsv, { h: 26, s: 0.76, v: 0.78 }, 0.85);

    if (isGreen && greenPos.x > x) {
      greenPos.x = x;
      greenPos.y = y;
    }

    pxData[n] = {
      r: uint8Arr[i + 0],
      g: uint8Arr[i + 1],
      b: uint8Arr[i + 2],
      ...hsv,
      isGreen,
      isOrange,
    };
  }

  for (let y = greenPos.y - 30; y < greenPos.y; y++) {
    for (let x = greenPos.x + 100; x < w - 100; x++) {
      const n = w * y + x;
      const p = pxData[n];
      if (p?.isOrange && orangePos.x > x) {
        orangePos.x = x;
        orangePos.y = y;
      }
    }
  }

  const ratio = (orangePos.x - greenPos.x) / 305;

  const isDual = findPixelData(
    pxData,
    w,
    h,
    Math.round(greenPos.x + 63 * ratio),
    Math.round(greenPos.y + 71 * ratio),
    1,
    1,
    { h: 19, s: 0.86, v: 0.52 },
    0.8
  );

  const isAdditional = findPixelData(
    pxData,
    w,
    h,
    Math.round(greenPos.x + 61 * ratio),
    Math.round(greenPos.y + 537 * ratio),
    1,
    1,
    { h: 211, s: 0.44, v: 0.76 },
    0.9
  );

  const isWeapon = findPixelData(
    pxData,
    w,
    h,
    Math.round(greenPos.x + 40 * ratio),
    Math.round(greenPos.y + 30 * ratio),
    1,
    1,
    { h: 181, s: 0.49, v: 0.65 },
    0.8
  );

  const isSummon = findPixelData(
    pxData,
    w,
    h,
    Math.round(greenPos.x + 0 * ratio),
    Math.round(greenPos.y + 30 * ratio),
    1,
    1,
    { h: 33, s: 0.49, v: 0.49 },
    0.8
  );

  const weaponPos1 = isDual
    ? {
        x: Math.round(greenPos.x - 8 * ratio),
        y: Math.round(greenPos.y + 40 * ratio),
        w: Math.round(598 * ratio),
        h: Math.round(474 * ratio),
      }
    : {
        x: Math.round(greenPos.x - 8 * ratio),
        y: Math.round(greenPos.y + 40 * ratio),
        w: Math.round(598 * ratio),
        h: Math.round(464 * ratio),
      };

  const weaponPos2 = {
    x: Math.round(greenPos.x - 8 * ratio),
    y: Math.round(greenPos.y + 526 * ratio),
    w: Math.round(598 * ratio),
    h: Math.round(158 * ratio),
  };

  const summonPos1 = {
    x: Math.round(greenPos.x - 4 * ratio),
    y: Math.round(greenPos.y + 50 * ratio),
    w: Math.round(600 * ratio),
    h: Math.round(460 * ratio),
  };
  const summonPos2 = {
    x: Math.round(greenPos.x - 2 * ratio),
    y: Math.round(greenPos.y + 546 * ratio),
    w: Math.round(600 * ratio),
    h: Math.round(140 * ratio),
  };

  return {
    pxData: pxData,
    greenPos,
    orangePos,
    isWeapon,
    isDual,
    isAdditional,
    isSummon,
    weaponPos1,
    weaponPos2,
    summonPos1,
    summonPos2,
    w,
    h,
  };
}
