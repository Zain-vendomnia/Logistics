export const base64ToCanvas = async (
  base64: string
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
  });
};

export function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
}

export const formatTime = (ms: number) => {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);

  if (sec === 0) {
    return `${min} Minutes`;
  } else {
    return `${min}m ${sec}s`;
  }
};

export const formatTime_ms = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
