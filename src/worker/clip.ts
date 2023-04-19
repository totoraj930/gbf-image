import { getCharacterPos } from './character';
import { getWeaponPixelData } from './weapon';

export type ClipedImage =
  | WeaponImage
  | SummonImage
  | CharacterImage
  | UnknownImage;

export type WeaponImage = {
  type: 'Weapon';
  isAdditional: boolean;
  isDual: boolean;
  imageData: ImageData;
};
export type SummonImage = {
  type: 'Summon';
  imageData: ImageData;
};
export type CharacterImage = {
  type: 'Character';
  imageData: ImageData;
};
export type UnknownImage = {
  type: 'Unknown';
  imageData: ImageData;
};

export async function getClipImageData(
  image: HTMLImageElement
): Promise<ClipedImage> {
  const w = image.width;
  const h = image.height;
  const $canvas = document.createElement('canvas');
  $canvas.width = image.width;
  $canvas.height = image.height;
  const ctx = $canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height, {
    colorSpace: 'srgb',
  });

  const weaponRes = await getWeaponPixelData(imageData);

  if (weaponRes.isWeapon) {
    const {
      isDual,
      isAdditional,
      weaponPos1: rect1,
      weaponPos2: rect2,
    } = weaponRes;
    if (isAdditional) {
      const rectData1 = ctx.getImageData(rect1.x, rect1.y, rect1.w, rect1.h);
      const rectData2 = ctx.getImageData(rect2.x, rect2.y, rect2.w, rect2.h);
      $canvas.width = Math.max(rect1.w, rect2.w);
      $canvas.height = rect1.h + rect2.h;
      ctx.putImageData(rectData1, 0, 0);
      ctx.putImageData(rectData2, 0, rect1.h);
      const resImageData = ctx.getImageData(
        0,
        0,
        $canvas.width,
        $canvas.height
      );
      return {
        type: 'Weapon',
        isAdditional,
        isDual,
        imageData: resImageData,
      };
    } else {
      const resImageData = ctx.getImageData(rect1.x, rect1.y, rect1.w, rect1.h);
      return {
        type: 'Weapon',
        isAdditional,
        isDual,
        imageData: resImageData,
      };
    }
  } else if (weaponRes.isSummon) {
    const { summonPos1: rect1, summonPos2: rect2 } = weaponRes;
    const rectData1 = ctx.getImageData(rect1.x, rect1.y, rect1.w, rect1.h);
    const rectData2 = ctx.getImageData(rect2.x, rect2.y, rect2.w, rect2.h);
    $canvas.width = Math.max(rect1.w, rect2.w);
    $canvas.height = rect1.h + rect2.h;
    ctx.putImageData(rectData1, 0, 0);
    ctx.putImageData(rectData2, 0, rect1.h);
    const resImageData = ctx.getImageData(0, 0, $canvas.width, $canvas.height);
    return {
      type: 'Summon',
      imageData: resImageData,
    };
  } else {
    const {
      isCharacter,
      characterPos: rect,
      lineData,
    } = await getCharacterPos(imageData);

    if (isCharacter) {
      // ctx.strokeStyle = 'red';
      // ctx.lineWidth = 5;
      // for (const r of rect) {
      //   ctx.strokeRect(r.x, r.y, r.w, r.h);
      // }
      // const resImageData = ctx.getImageData(
      //   0,
      //   0,
      //   $canvas.width,
      //   $canvas.height
      // );

      // for (let i = 0; i < resImageData.data.length; i += 4) {
      //   const n = i / 4;
      //   if (lineData[n]) {
      //     resImageData.data[i + 0] = 0;
      //     resImageData.data[i + 1] = 255;
      //     resImageData.data[i + 2] = 0;
      //   }
      // }
      const resImageData = ctx.getImageData(rect.x, rect.y, rect.w, rect.h);
      return {
        type: 'Character',
        imageData: resImageData,
      };
    }
  }

  return {
    type: 'Unknown',
    imageData,
  };
}
