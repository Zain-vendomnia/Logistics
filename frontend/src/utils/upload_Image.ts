import axios from "axios";

export const uploadImage = async (dataURI: string) => {
  const blob = dataUriToBlob(dataURI);
  const formData = new FormData();
  formData.append("file", blob, "image.jpg");

  try {
    const response = await axios.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Image uploaded successfully: ", response.data);
    return response.data;
  } catch (error) {
    console.error("Error uploading image: ", error);

    if (error instanceof Error) {
      throw new Error(error.message, error);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
};

function dataUriToBlob (dataURI: string): Blob {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  console.log("blob: ", new Blob([ab], { type: mimeString }));
  return new Blob([ab], { type: mimeString });
}

export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
