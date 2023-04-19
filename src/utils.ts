export type RGB = {
  r: number;
  g: number;
  b: number;
};
export type HSV = {
  h: number;
  s: number;
  v: number;
};

export function rgbToHsv(r: number, g: number, b: number): HSV;
export function rgbToHsv(rgb: RGB): HSV;

/**
 * from ChatGPT
 */
export function rgbToHsv(_r: number | RGB, _g?: number, _b?: number): HSV {
  let r = typeof _r === 'number' ? _r : _r.r;
  let g = typeof _r === 'number' ? _g : _r.g;
  let b = typeof _r === 'number' ? _b : _r.b;

  (r /= 255), (g /= 255), (b /= 255);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h: number, s: number, v: number;

  if (max === min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }

  s = max == 0 ? 0 : diff / max;
  v = max;

  return { h: h * 360, s, v };
}

/**
 * from ChatGPT
 */
export function hsvToRgb(h: number, s: number, v: number): RGB;
export function hsvToRgb(hsv: HSV): RGB;
export function hsvToRgb(h: number | HSV, s?: number, v?: number): RGB {
  let hValue: number;
  let sValue: number;
  let vValue: number;

  if (typeof h === 'object') {
    hValue = h.h;
    sValue = h.s;
    vValue = h.v;
  } else {
    if (s === undefined || v === undefined) {
      throw new Error('Invalid arguments for hsvToRgb');
    }

    hValue = h;
    sValue = s;
    vValue = v;
  }

  // HSV to RGB conversion logic
  let r: number, g: number, b: number;
  const i = Math.floor(hValue * 6);
  const f = hValue * 6 - i;
  const p = vValue * (1 - sValue);
  const q = vValue * (1 - f * sValue);
  const t = vValue * (1 - (1 - f) * sValue);

  switch (i % 6) {
    case 0:
      (r = vValue), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = vValue), (b = p);
      break;
    case 2:
      (r = p), (g = vValue), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = vValue);
      break;
    case 4:
      (r = t), (g = p), (b = vValue);
      break;
    case 5:
      (r = vValue), (g = p), (b = q);
      break;
    default:
      throw new Error('Unexpected case in hsvToRgb');
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function rgbaArrayToHsvArray(uint8Array: Uint8ClampedArray) {
  const res: HSV[] = new Array(uint8Array.length / 4);
  for (let i = 0; i < uint8Array.length; i += 4) {
    const hsv = rgbToHsv({
      r: uint8Array[i + 0],
      g: uint8Array[i + 1],
      b: uint8Array[i + 2],
    });
    res[i / 4] = hsv;
  }
  return res;
}

export function inRange(target: number, min: number, max: number) {
  return min <= target && target <= max;
}

/**
 * aとbを比較して範囲内ならtrue
 * @param a
 * @param b
 * @param threshold 許容する割合(0-1)
 */
export function inRangeHsv(a: HSV, b: HSV, threshold: number) {
  const hMin = a.h * threshold;
  const hMax = a.h / threshold;
  const sMin = a.s * threshold;
  const sMax = a.s / threshold;
  const vMin = a.v * threshold;
  const vMax = a.v / threshold;
  return (
    inRange(b.h, hMin, hMax) &&
    inRange(b.s, sMin, sMax) &&
    inRange(b.v, vMin, vMax)
  );
}

export function findPixelData(
  pxData: HSV[],
  dataWidth: number,
  dataHeight: number,
  sx: number,
  sy: number,
  w: number,
  h: number,
  hsv: HSV,
  threshold: number
) {
  if (dataWidth < sx || dataHeight < sy) return false;
  for (let y = sy; y < sy + h; y++) {
    for (let x = sx; x < sx + w; x++) {
      const data = pxData[dataWidth * y + x];
      if (!data) continue;
      if (inRangeHsv(data, hsv, threshold)) {
        return true;
      }
    }
  }
  return false;
}

export type Rect = {
  x: number; // 四角形の左上角の横軸座標
  y: number; // 四角形の左上角の縦軸座標
  w: number; // 四角形の幅
  h: number; // 四角形の高さ
};

function mergeOverlappingRects(rectangles: Rect[]): Rect[] {
  const result: Rect[] = [];

  for (const a of rectangles) {
    let count = 0;
    for (const b of result) {
      const diffX = Math.abs(a.x - b.x);
      const diffY = Math.abs(a.y - b.y);
      const diffW = Math.max(a.w, b.w) / Math.min(a.w, b.w);
      const diffH = Math.max(a.h, b.h) / Math.min(a.h, b.h);

      // 開始位置と大きさが同じならカウント
      if (diffX < 10 && diffY < 10 && diffW < 1.1 && diffH < 1.1) {
        count++;
      }
    }
    if (count === 0) {
      result.push(a);
    }
  }
  return result;
}

export function detectRect(pxData: boolean[], w: number, h: number): Rect[] {
  const rects: Rect[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = w * y + x;
      if (!pxData[i]) continue;
      let blankCount = 0;
      // 隣接しているpxの空白をカウントする
      const range = 1;
      for (let iy = y - range; iy < y + range; iy++) {
        for (let ix = x - range; ix < x + range; ix++) {
          const ii = w * iy + ix;
          const p = pxData[ii];
          if (!p) blankCount++;
        }
      }
      // 隣接しているpxに空白がなければ処理しない
      // if (blankCount < 1) continue;

      // 繋がっていなくても許容するpx
      const tolerance = 10;

      // 横方向の距離をカウント
      blankCount = 0;
      let rectW = 1;
      for (let ix = x + 1; ix < w; ix++) {
        const ii = w * y + ix;
        if (pxData[ii]) {
          rectW += blankCount + 1;
          blankCount = 0;
        } else {
          blankCount++;
          if (blankCount > tolerance) {
            break;
          }
        }
      }

      // 縦方向の距離をカウント
      blankCount = 0;
      let rectH = 1;
      for (let iy = y + 1; iy < h; iy++) {
        const ii = w * iy + x;
        if (pxData[ii]) {
          rectH += blankCount + 1;
          blankCount = 0;
        } else {
          blankCount++;
          if (blankCount > tolerance) {
            break;
          }
        }
      }

      // 50px以上なら追加
      if (rectW >= 50 && rectH >= 50) {
        rects.push({
          x,
          y,
          w: rectW,
          h: rectH,
        });
      }
    }
  }
  return mergeOverlappingRects(rects);
}
