import { For, Show, createEffect, createSignal } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { ImageInput } from './FileInput';
import { ClipedImage, getClipImageData } from './worker/clip';
import clsx from 'clsx';

function PreviewCanvas(props: { data: ClipedImage; onDelete: () => void }) {
  return (
    <div class="relative">
      <button
        class={clsx(
          'absolute right-[5px] top-[5px] px-[10px] py-[5px]',
          'rounded-full bg-white text-[14px] text-red-600',
          'shadow'
        )}
        onClick={() => props.onDelete()}
      >
        削除
      </button>
      <canvas
        class={clsx('h-[120px] w-auto')}
        width={props.data.imageData.width}
        height={props.data.imageData.height}
        ref={($canvas) => {
          setTimeout(() => {
            $canvas.width = props.data.imageData.width;
            $canvas.height = props.data.imageData.height;
            const ctx = $canvas.getContext('2d');
            ctx.putImageData(props.data.imageData, 0, 0);
          }, 1);
        }}
      />
    </div>
  );
}

function getScaleCanvas(imageData: ImageData, w: number, h: number) {
  return window.createImageBitmap(imageData, {
    resizeWidth: w,
    resizeHeight: h,
  });
}

function App() {
  const [line1, setLine1] = createSignal<ClipedImage[]>([]);
  const [line2, setLine2] = createSignal<ClipedImage[]>([]);
  const [url, setURL] = createSignal('');

  createEffect(() => {
    line1();
    line2();
    generateImage();
  });

  async function generateImage() {
    const $canvas = document.createElement('canvas');
    const lh1 = 600;
    const lh2 = 400;
    let lineW1 = 0;
    const l1 = line1().map(({ imageData: data }) => {
      const h = lh1;
      const w = Math.round((lh1 / data.height) * data.width);
      lineW1 += w;
      return {
        w,
        h,
        data,
      };
    });
    let lineW2 = 0;
    const l2 = line2().map(({ imageData: data }) => {
      const h = lh2;
      const w = Math.round((lh2 / data.height) * data.width);
      lineW2 += w;
      return {
        w,
        h,
        data,
      };
    });

    const width = Math.max(lineW1, lineW2);
    const lineH1 = line1().length > 0 ? lh1 : 0;
    const lineH2 = line2().length > 0 ? lh2 : 0;
    const height = lineH1 + lineH2;

    if (width === 0 && height === 0) {
      setURL((prev) => {
        window.URL.revokeObjectURL(prev);
        return '';
      });
      return;
    }

    const ctx = $canvas.getContext('2d');
    $canvas.width = width;
    $canvas.height = height;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    let prevX = 0;
    for (const { data, w, h } of l1) {
      const img = await getScaleCanvas(data, w, h);
      ctx.drawImage(img, prevX, 0);
      prevX += w;
    }

    prevX = 0;
    for (const { data, w, h } of l2) {
      const img = await getScaleCanvas(data, w, h);
      ctx.drawImage(img, prevX, lineH1);
      prevX += w;
    }

    $canvas.toBlob((blob) => {
      const url = window.URL.createObjectURL(blob);
      setURL((prev) => {
        window.URL.revokeObjectURL(prev);
        return url;
      });
    });
  }

  return (
    <div class="p-[10px]">
      <header class="flex max-w-[500px] gap-[10px]">
        <div class="flex-1 text-[14px]">
          <ImageInput
            onInput={async (image) => {
              const res = await getClipImageData(image);
              console.log(res);
              if (res.type === 'Weapon' || res.type === 'Summon') {
                setLine1((prev) => {
                  prev.push(res);
                  return [...prev];
                });
              } else {
                setLine2((prev) => {
                  prev.push(res);
                  return [...prev];
                });
              }
            }}
          />
        </div>
      </header>
      <Show when={url().length > 0}>
        <div>
          <p>生成された画像</p>

          <a
            href={url()}
            download={Date.now() + '.png'}
            class={clsx(
              'inline-block bg-sky-500 text-white',
              'mb-[10px] rounded-[4px] px-[20px] py-[5px]'
            )}
          >
            保存
          </a>
          <div
            class={clsx('w-fit border border-solid border-gray-500 p-[5px]')}
          >
            <img src={url()} class={clsx('max-h-[400px]')} />
          </div>
        </div>
      </Show>

      <div class={clsx('mx-auto my-[10px] flex flex-col')}>
        <div class="flex">
          <For each={line1()}>
            {(item, index) => {
              return (
                <PreviewCanvas
                  data={item}
                  onDelete={() => {
                    setLine1((prev) => {
                      prev.splice(index(), 1);
                      return [...prev];
                    });
                  }}
                />
              );
            }}
          </For>
        </div>
        <div class="flex">
          <For each={line2()}>
            {(item, index) => {
              return (
                <PreviewCanvas
                  data={item}
                  onDelete={() => {
                    setLine2((prev) => {
                      prev.splice(index(), 1);
                      return [...prev];
                    });
                  }}
                />
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}

// memo

export default App;
