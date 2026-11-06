import type { Area } from "react-easy-crop";

/** Export the exact square selected in the editor, not the original image. */
export async function cropAvatar(source: string, area: Area): Promise<File> {
  const image = new Image();
  image.src = source;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Photo adjustment is unavailable. Please try another browser.");
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, 512, 512);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("Couldn't prepare this photo. Please choose another image."));
    }, "image/jpeg", 0.92);
  });
  return new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
}