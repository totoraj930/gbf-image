import CharacterWorker from './character.worker?worker';
import {
  TaskMessage,
  ResultMessage,
  getCharacterPos as gcp,
} from './character.worker';
import { rgbaArrayToHsvArray } from '../utils';

const worker = new CharacterWorker();

let __id = 0;
export function getCharacterPos(
  imageData: ImageData
): Promise<ResultMessage['data']> {
  return new Promise((resolve) => {
    const hsv = rgbaArrayToHsvArray(imageData.data);
    const { width: w, height: h } = imageData;
    resolve(gcp(hsv, w, h));
    return;
    // TODO: WebWorkerだとおちる
    const id = ++__id + '';
    const task: TaskMessage = {
      imageData,
      id,
    };
    const onMessage = (msg: MessageEvent<ResultMessage>) => {
      if (msg.data.id === id) {
        worker.removeEventListener('message', onMessage);
        resolve(msg.data.data);
      }
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage(task);
  });
}
