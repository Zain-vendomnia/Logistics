import axios from "axios";

class UploadImage {
  async upload(dataURI: string) {
    const blob = this.dataURItoBlob(dataURI);
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
      throw error;
    }
  }

  private dataURItoBlob(dataURI: string) {
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
}

export default new UploadImage();
