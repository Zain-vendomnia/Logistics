// utils/imageConverter.ts

export const base64ToBuffer = (base64String: string): Buffer => {
    const base64Data = base64String.includes(',')
      ? base64String.split(',')[1]
      : base64String;
    return Buffer.from(base64Data, 'base64');
  };
  
  export const bufferToBase64 = (buffer: Buffer, mimeType = "image/jpeg"): string => {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  };
  