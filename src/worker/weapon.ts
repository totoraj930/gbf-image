import WeaponWorker from './weapon.worker?worker';
import {
  TaskMessage,
  ResultMessage,
  getWeaponPixelData as gwpd,
} from './weapon.worker';

const worker = new WeaponWorker();

let __id = 0;
export function getWeaponPixelData(
  imageData: ImageData
): Promise<ResultMessage['data']> {
  return new Promise((resolve) => {
    resolve(gwpd(imageData));
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
