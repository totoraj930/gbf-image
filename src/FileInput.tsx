import clsx from 'clsx';

type Props = {
  onInput: (image: HTMLImageElement) => void;
};
export function ImageInput(props: Props) {
  function onInput(file: File) {
    if (!/^image/.test(file.type)) return;
    const image = new Image();
    const blobUrl = window.URL.createObjectURL(file);
    image.src = blobUrl;
    image.onload = () => {
      props.onInput(image);
    };

    // const reader = new FileReader();
    // const image = new Image();
    // reader.readAsArrayBuffer(file);

    // reader.onload = (e) => {
    //   if (typeof reader.result !== 'string') {
    //     const blob = new Blob([reader.result], {
    //       type: file.type
    //     });

    //   }
    //   image.src = reader.result + '';
    //   image.onload = () => {
    //     props.onInput(image);
    //   };
    // };
  }
  return (
    <div
      class={clsx(
        'p-[10px]',
        'flex flex-col items-center',
        'gap-[10px] border border-solid border-gray-400',
        'focus:bg-sky-100'
      )}
      tabIndex={0}
      onPaste={(e) => {
        try {
          for (const file of e.clipboardData.files) {
            onInput(file);
          }
        } catch {}
      }}
      onDragOver={(e) => {
        e.dataTransfer.dropEffect = 'copy';
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        try {
          e.preventDefault();
          for (const file of e.dataTransfer.files) {
            onInput(file);
          }
        } catch {}
      }}
    >
      <p>貼り付け or ドロップ</p>
      <input
        type="file"
        accept="image/*"
        multiple={true}
        onInput={(e) => {
          try {
            for (const file of e.currentTarget.files) {
              onInput(file);
            }
          } catch {}
        }}
      />
    </div>
  );
}
