export const uploadToCloudinary = async (uri:string) => {
  const CLOUD_NAME = "codespace555";
  const UPLOAD_PRESET = "aryaco"; // Ensure this matches your Cloudinary upload preset

   const fileType = uri.split(".").pop();

  const formData = new FormData();
  formData.append("file", {
    uri,
    type: `image/${fileType}`,
    name: `upload.${fileType}`,
  } as any); // `as any` to avoid type error on React Native

  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
  };
 
};

export const deleteFromCloudinary = async (publicId: string) => {
  const CLOUD_NAME = "codespace555";
  const UPLOAD_PRESET = "";
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/delete-image`,
    {
      method: "POST",
      body: JSON.stringify({ publicId }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete image from Cloudinary");
  }
};
