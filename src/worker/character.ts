import CharacterWorker from './character.worker?worker';
import { TaskMessage, ResultMessage } from './character.worker';

const worker = new CharacterWorker();

let __id = 0;
export function getCharacterPos(
  imageData: ImageData
): Promise<ResultMessage['data']> {
  return new Promise((resolve) => {
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
