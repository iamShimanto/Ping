import { cloudinary } from "@repo/config";

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string,
) => {
  const base64String = file.buffer.toString("base64");
  const dataUrl = `data:${file.mimetype};base64,${base64String}`;

  const isAudio = file.mimetype.startsWith("audio/");
  const isVideo = file.mimetype.startsWith("video/");

  return await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: isAudio || isVideo ? "video" : "image",
  });
};

export const destroyFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error: any) {
    if (error) {
      throw new Error(error);
    }
  }
};
