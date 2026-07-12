// const cloudName = process.env.REACT_APP_CLOUDE_NAME_CLOUDINARY; //next i will solve it why precess is undefined
// const REACT_APP_CLOUDE_NAME_CLOUDINARY = 'dhs48crvv';
// const cloudName = import.meta.env.VITE_CLOUD_NAME_CLOUDINARY;
// console.log("cloudName--.", cloudName);


// const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

// const uploadImage = async (image) => {

//     const formData = new FormData();

//     formData.append('file', image);
//     formData.append('upload_preset', 'qcommerce_product'); // Replace with your actual preset

//     try {
//         const dataResponse = await fetch(url, {
//             method: 'POST',
//             body: formData,
//         });

//         const result = await dataResponse.json();
//         console.log("uploadImage-response", result);
//         return result;
//     } catch (error) {
//         console.error("uploadImage-error", error);
//         return { error: true, message: "Upload failed" };
//     }
// };

// export default uploadImage;





// helpers/uploadImage.js
// Vite env (.env) থেকে নাও
// const cloudName = import.meta.env.VITE_CLOUD_NAME_CLOUDINARY;
// const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "qcommerce_product";
// // Optional: client-side guard
// const MAX_BYTES = Number(import.meta.env.VITE_CLOUDINARY_MAX_BYTES) || 10485760; // 10MB default

// // ❗ আগের /image/upload → এখন /auto/upload (image + video)
// const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

// const uploadImage = async (file) => {
//   try {
//     if (!file) return { error: true, message: "No file selected" };

//     // Optional: client-side size guard (preset-এও limit বড়াতে হবে)
//     if (file.size && file.size > MAX_BYTES) {
//       return {
//         error: true,
//         message: `File too large (${(file.size / 1024 / 1024).toFixed(
//           1
//         )}MB). Max ${(MAX_BYTES / 1024 / 1024).toFixed(1)}MB.`,
//       };
//     }

//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", preset);

//     const res = await fetch(url, { method: "POST", body: formData });
//     const result = await res.json();

//     // Cloudinary error pass-through
//     if (!res.ok || result?.error) {
//       return { error: true, message: result?.error?.message || "Upload failed" };
//     }

//     // normalize → আগের কোডে uploaded.url ব্যবহার হচ্ছে
//     if (!result.url && result.secure_url) result.url = result.secure_url;

//     return result;
//   } catch (error) {
//     console.error("uploadImage-error", error);
//     return { error: true, message: error?.message || "Upload failed" };
//   }
// };

// export default uploadImage;


// import SummaryApi from "../common";

// const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
// const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// const IMAGE_MAX_BYTES = 10485760;
// const VIDEO_MAX_BYTES = 52428800;

// const getSafeMessage = (message, fallback = "Upload failed") =>
//   typeof message === "string" && message.trim() ? message : fallback;

// const getAuthHeaders = () => {
//   const token = localStorage.getItem("authToken");
//   return token ? { Authorization: `Bearer ${token}` } : {};
// };

// const isVideoMediaType = (mediaType) => mediaType === "product-video";

// const getExpectedMaxSize = (mediaType) =>
//   isVideoMediaType(mediaType) ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;

// const validateFile = (file, mediaType) => {
//   if (!file) return "No file selected";

//   const allowedTypes = isVideoMediaType(mediaType) ? VIDEO_TYPES : IMAGE_TYPES;
//   const maxSize = getExpectedMaxSize(mediaType);

//   if (!allowedTypes.includes(file.type)) {
//      console.log("🦌◆Upload ooo000🦌◆",);
//     return isVideoMediaType(mediaType)
//       ? "Only MP4, WebM, or QuickTime videos are allowed"
//       : "Only JPEG, PNG, or WebP images are allowed";
//   }

//   if (file.size > maxSize) {
//     return `File too large (${(file.size / 1024 / 1024).toFixed(
//       1
//     )}MB). Max ${(maxSize / 1024 / 1024).toFixed(1)}MB.`;
//   }

//   return "";
// };

// const parseJsonResponse = async (response) => {
//   try {
//     return await response.json();
//   } catch {
//     return {};
//   }
// };

// const uploadImage = async (
//   file,
//   { mediaType = "product-image", productId } = {}
// ) => {
//   try {
//     const validationError = validateFile(file, mediaType);
//     if (validationError) return { error: true, message: validationError };

//     const presignedResponse = await fetch(SummaryApi.media_presigned_upload.url, {
//       method: SummaryApi.media_presigned_upload.method.toUpperCase(),
//       headers: {
//         "Content-Type": "application/json",
//         ...getAuthHeaders(),
//       },
//       credentials: "include",
//       body: JSON.stringify({
//         fileName: file.name,
//         contentType: file.type,
//         fileSize: file.size,
//         mediaType,
//         ...(productId ? { productId } : {}),
//       }),
//     });

//     const presignedData = await parseJsonResponse(presignedResponse);

//     if (!presignedResponse.ok || !presignedData?.uploadUrl) {
//        console.log("🦌◆Upload failed111🦌◆",s3Response);
//       return {
//         error: true,
//         message: getSafeMessage(presignedData?.message, "Upload failed"),
//       };
//     }

//     const s3Response = await fetch(presignedData.uploadUrl, {
//       method: presignedData.method,
//       headers: presignedData.headers || {},
//       body: file,
//     });

//     if (!s3Response.ok) {
//       console.log("🦌◆Upload failed🦌◆",s3Response);
      
//       return { error: true, message: "Upload failed" };
//     }

//     const confirmResponse = await fetch(SummaryApi.media_confirm_upload.url, {
//       method: SummaryApi.media_confirm_upload.method.toUpperCase(),
//       headers: {
//         "Content-Type": "application/json",
//         ...getAuthHeaders(),
//       },
//       credentials: "include",
//       body: JSON.stringify({
//         key: presignedData.key,
//         expectedContentType: file.type,
//         expectedMaxSize: getExpectedMaxSize(mediaType),
//       }),
//     });

//     const confirmedData = await parseJsonResponse(confirmResponse);

//     if (!confirmResponse.ok || !confirmedData?.url) {
//       return {
//         error: true,
//         message: getSafeMessage(confirmedData?.message, "Upload failed"),
//       };
//     }

//     return {
//       error: false,
//       url: confirmedData.url,
//       key: confirmedData.key,
//       contentType: confirmedData.contentType,
//       size: confirmedData.size,
//       etag: confirmedData.etag,
//     };
//   } catch (error) {
//     console.error("uploadImage-error", error);
//     return { error: true, message: "Upload failed" };
//   }
// };

// export default uploadImage;





// import SummaryApi from "../common";

// const IMAGE_TYPES = [
//   "image/jpeg",
//   "image/png",
//   "image/webp",
//   "image/heic",
//   "image/heif",
// ];

// const VIDEO_TYPES = [
//   "video/mp4",
//   "video/webm",
//   "video/quicktime",
// ];
// const MIME_BY_EXTENSION = {
//   jpg: "image/jpeg",
//   jpeg: "image/jpeg",
//   png: "image/png",
//   webp: "image/webp",
//   heic: "image/heic",
//   heif: "image/heif",
//   mp4: "video/mp4",
//   webm: "video/webm",
//   mov: "video/quicktime",
//   qt: "video/quicktime",
// };

// const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
// const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

// const getSafeMessage = (message, fallback = "Upload failed") =>
//   typeof message === "string" && message.trim() ? message : fallback;

// const getAuthHeaders = () => {
//   const token = localStorage.getItem("authToken");

//   return token
//     ? {
//         Authorization: `Bearer ${token}`,
//       }
//     : {};
// };

// const getFileExtension = (fileName = "") =>
//   String(fileName).split(".").pop()?.trim().toLowerCase() || "";

// const getNormalizedContentType = (file) => {
//   const browserType = String(file?.type || "").trim().toLowerCase();

//   if (browserType) {
//     return browserType;
//   }

//   return MIME_BY_EXTENSION[getFileExtension(file?.name)] || "";
// };

// const isVideoMediaType = (mediaType) => mediaType === "product-video";

// const getExpectedMaxSize = (mediaType) =>
//   isVideoMediaType(mediaType) ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;

// const validateFile = (file, mediaType) => {
//   if (!file) {
//     return "No file selected";
//   }

//   if (!file.size) {
//     return "Empty file is not allowed";
//   }

//   const allowedTypes = isVideoMediaType(mediaType)
//     ? VIDEO_TYPES
//     : IMAGE_TYPES;
//   const contentType = getNormalizedContentType(file);

//   const maxSize = getExpectedMaxSize(mediaType);

//    if (!allowedTypes.includes(contentType)) {
//     return isVideoMediaType(mediaType)
//       ? "Only MP4, WebM, or QuickTime videos are allowed"
//        : "Only JPEG, PNG, WebP, HEIC, or HEIF images are allowed";
//   }

//   if (file.size > maxSize) {
//     return `File too large (${(file.size / 1024 / 1024).toFixed(
//       1
//     )}MB). Max ${(maxSize / 1024 / 1024).toFixed(1)}MB.`;
//   }

//   return "";
// };

// const parseJsonResponse = async (response) => {
//   try {
//     return await response.json();
//   } catch {
//     return {};
//   }
// };

// const uploadImage = async (
//   file,
//   {
//     mediaType = "product-image",
//     productId,
//     uploadSessionId,
//   } = {}
// ) => {
//   try {
//     const validationError = validateFile(file, mediaType);

//     if (validationError) {
//       return {
//         error: true,
//         message: validationError,
//       };
//     }

//     const contentType = getNormalizedContentType(file);
//     const safeFileName = file.name || `upload-${Date.now()}`;

//     // 1. Backend থেকে presigned URL নেওয়া
//     const presignedResponse = await fetch(
//       SummaryApi.media_presigned_upload.url,
//       {
//         method:
//           SummaryApi.media_presigned_upload.method?.toUpperCase() || "POST",
//         headers: {
//           "Content-Type": "application/json",
//           ...getAuthHeaders(),
//         },
//         credentials: "include",
//         body: JSON.stringify({
//           fileName: safeFileName,
//           contentType,
//           fileSize: file.size,
//           mediaType,
//           ...(productId ? { productId } : {}),
//           ...(uploadSessionId ? { uploadSessionId } : {}),
//         }),
//       }
//     );

//     const presignedResult = await parseJsonResponse(presignedResponse);
//     const presignedData = presignedResult?.data;

//     if (
//       !presignedResponse.ok ||
//       !presignedResult?.success ||
//       !presignedData?.uploadUrl ||
//       !presignedData?.key
//     ) {
//       console.error(
//         "Presigned upload request failed:",
//         presignedResponse.status
//       );

//       return {
//         error: true,
//         message: getSafeMessage(
//           presignedResult?.message,
//           "Could not create upload URL"
//         ),
//       };
//     }

//     // 2. File সরাসরি S3-তে upload করা
//     const s3Response = await fetch(presignedData.uploadUrl, {
//       method: presignedData.method || "PUT",
//       headers: presignedData.headers || {},
//       body: file,
//       credentials: "omit",
//     });

//     if (!s3Response.ok) {
//       console.error("S3 upload failed:", s3Response.status);

//       return {
//         error: true,
//         message: "File upload failed",
//       };
//     }

//     // 3. Backend দিয়ে আসল uploaded object verify করা
//     const confirmResponse = await fetch(
//       SummaryApi.media_confirm_upload.url,
//       {
//         method:
//           SummaryApi.media_confirm_upload.method?.toUpperCase() || "POST",
//         headers: {
//           "Content-Type": "application/json",
//           ...getAuthHeaders(),
//         },
//         credentials: "include",
//         body: JSON.stringify({
//           key: presignedData.key,
//           expectedContentType: contentType,
//           expectedMaxSize: getExpectedMaxSize(mediaType),
//         }),
//       }
//     );

//     const confirmResult = await parseJsonResponse(confirmResponse);
//     const confirmedData = confirmResult?.data;

//     if (
//       !confirmResponse.ok ||
//       !confirmResult?.success ||
//       !confirmedData?.url
//     ) {
//       console.error(
//         "Upload confirmation failed:",
//         confirmResponse.status
//       );

//       return {
//         error: true,
//         message: getSafeMessage(
//           confirmResult?.message,
//           "Upload confirmation failed"
//         ),
//       };
//     }

//     return {
//       error: false,
//       url: confirmedData.url,
//       key: confirmedData.key,
//       contentType: confirmedData.contentType,
//       size: confirmedData.size,
//       etag: confirmedData.etag,
//       uploadSessionId: presignedData.uploadSessionId,
//     };
//   } catch (error) {
//     console.error("uploadImage-error:", error?.message);

//     return {
//       error: true,
//       message: "Upload failed",
//     };
//   }
// };

// export default uploadImage;




import SummaryApi from "../common";

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MIME_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  qt: "video/quicktime",
};

/*
 * Original mobile camera image সর্বোচ্চ 30MB পর্যন্ত select করা যাবে।
 * S3-তে upload হওয়ার আগে বড় image WebP format-এ compress হবে।
 */
const SOURCE_IMAGE_MAX_BYTES = 30 * 1024 * 1024;

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

/*
 * প্রায় 300–400KB-এর মধ্যে রাখার configuration
 */
const IMAGE_TARGET_BYTES = 380 * 1024;
const IMAGE_HARD_MAX_BYTES = 400 * 1024;

const IMAGE_MAX_DIMENSION = 1600;
const IMAGE_MIN_DIMENSION = 640;

const OUTPUT_IMAGE_TYPE = "image/webp";
const OUTPUT_IMAGE_EXTENSION = "webp";

const getSafeMessage = (message, fallback = "Upload failed") =>
  typeof message === "string" && message.trim()
    ? message
    : fallback;

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

const getFileExtension = (fileName = "") =>
  String(fileName)
    .split(".")
    .pop()
    ?.trim()
    .toLowerCase() || "";

const replaceFileExtension = (
  fileName = "upload",
  extension = "webp"
) => {
  const cleanName =
    String(fileName || "upload").trim() || "upload";

  const dotIndex = cleanName.lastIndexOf(".");

  const baseName =
    dotIndex > 0
      ? cleanName.slice(0, dotIndex)
      : cleanName;

  return `${baseName}.${extension}`;
};

const getNormalizedContentType = (file) => {
  const browserType = String(file?.type || "")
    .trim()
    .toLowerCase();

  if (browserType) {
    return browserType;
  }

  return (
    MIME_BY_EXTENSION[getFileExtension(file?.name)] || ""
  );
};

const isVideoMediaType = (mediaType) =>
  mediaType === "product-video";

const getExpectedMaxSize = (mediaType) =>
  isVideoMediaType(mediaType)
    ? VIDEO_MAX_BYTES
    : IMAGE_MAX_BYTES;

const validateOriginalFile = (file, mediaType) => {
  if (!file) {
    return "No file selected";
  }

  if (!file.size) {
    return "Empty file is not allowed";
  }

  const isVideo = isVideoMediaType(mediaType);

  const allowedTypes = isVideo
    ? VIDEO_TYPES
    : IMAGE_TYPES;

  const contentType = getNormalizedContentType(file);

  const maxSourceSize = isVideo
    ? VIDEO_MAX_BYTES
    : SOURCE_IMAGE_MAX_BYTES;

  if (!allowedTypes.includes(contentType)) {
    return isVideo
      ? "Only MP4, WebM, or QuickTime videos are allowed"
      : "Only JPEG, PNG, WebP, HEIC, or HEIF images are allowed";
  }

  if (file.size > maxSourceSize) {
    return `File too large (${(
      file.size /
      1024 /
      1024
    ).toFixed(1)}MB). Max ${(
      maxSourceSize /
      1024 /
      1024
    ).toFixed(1)}MB.`;
  }

  return "";
};

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const canvasToBlob = (
  canvas,
  type,
  quality
) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error("Image compression failed")
          );
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });

const loadImageSource = async (blob) => {
  /*
   * Modern browser-এর জন্য createImageBitmap।
   */
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: "from-image",
      });

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close?.(),
      };
    } catch {
      /*
       * কিছু mobile browser createImageBitmap দিয়ে
       * image decode করতে পারে না।
       * সেক্ষেত্রে নিচের Image fallback চলবে।
       */
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl =
      URL.createObjectURL(blob);

    const image = new Image();

    image.onload = () => {
      resolve({
        source: image,
        width:
          image.naturalWidth || image.width,
        height:
          image.naturalHeight || image.height,
        cleanup: () =>
          URL.revokeObjectURL(objectUrl),
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(
        new Error(
          "This browser could not read the selected image"
        )
      );
    };

    image.src = objectUrl;
  });
};

const convertHeicToJpeg = async (file) => {
  const contentType =
    getNormalizedContentType(file);

  if (
    !["image/heic", "image/heif"].includes(
      contentType
    )
  ) {
    return file;
  }

  /*
   * HEIC/HEIF file select করলেই শুধু
   * heic2any package load হবে।
   */
  const heicModule = await import("heic2any");

  const heic2any =
    heicModule.default || heicModule;

  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  const convertedBlob = Array.isArray(converted)
    ? converted[0]
    : converted;

  if (!convertedBlob) {
    throw new Error(
      "HEIC image conversion failed"
    );
  }

  return new File(
    [convertedBlob],
    replaceFileExtension(file.name, "jpg"),
    {
      type: "image/jpeg",
      lastModified:
        file.lastModified || Date.now(),
    }
  );
};

const calculateDimensions = (
  width,
  height,
  maxDimension
) => {
  const largestSide = Math.max(
    width,
    height
  );

  if (largestSide <= maxDimension) {
    return {
      width: Math.max(
        1,
        Math.round(width)
      ),
      height: Math.max(
        1,
        Math.round(height)
      ),
    };
  }

  const scale =
    maxDimension / largestSide;

  return {
    width: Math.max(
      1,
      Math.round(width * scale)
    ),
    height: Math.max(
      1,
      Math.round(height * scale)
    ),
  };
};

const findBestCompressedBlob = async (
  canvas
) => {
  let minimumQuality = 0.32;
  let maximumQuality = 0.94;

  let bestBlob = null;

  /*
   * Binary search ব্যবহার করে highest possible
   * quality রেখে প্রায় 380KB-এর নিচে রাখবে।
   */
  for (
    let attempt = 0;
    attempt < 9;
    attempt += 1
  ) {
    const quality =
      (minimumQuality + maximumQuality) / 2;

    const blob = await canvasToBlob(
      canvas,
      OUTPUT_IMAGE_TYPE,
      quality
    );

    if (blob.size <= IMAGE_TARGET_BYTES) {
      bestBlob = blob;
      minimumQuality = quality;
    } else {
      maximumQuality = quality;
    }
  }

  if (bestBlob) {
    return bestBlob;
  }

  /*
   * Lowest quality-তেও 380KB না হলে
   * অন্তত 400KB hard limit check করবে।
   */
  const fallbackBlob =
    await canvasToBlob(
      canvas,
      OUTPUT_IMAGE_TYPE,
      0.28
    );

  return fallbackBlob.size <=
    IMAGE_HARD_MAX_BYTES
    ? fallbackBlob
    : null;
};

const compressImage = async (
  originalFile
) => {
  /*
   * iPhone HEIC/HEIF হলে আগে JPEG-তে convert।
   */
  const convertedFile =
    await convertHeicToJpeg(originalFile);

  /*
   * Image আগে থেকেই 400KB বা তার কম হলে
   * আবার compress করবে না।
   *
   * এতে ছোট image-এর quality নষ্ট হবে না।
   */
  if (
    convertedFile.size <=
    IMAGE_HARD_MAX_BYTES
  ) {
    return convertedFile;
  }

  const loadedImage =
    await loadImageSource(convertedFile);

  try {
    let maxDimension =
      IMAGE_MAX_DIMENSION;

    while (
      maxDimension >=
      IMAGE_MIN_DIMENSION
    ) {
      const dimensions =
        calculateDimensions(
          loadedImage.width,
          loadedImage.height,
          maxDimension
        );

      const canvas =
        document.createElement("canvas");

      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const context = canvas.getContext(
        "2d",
        {
          alpha: true,
        }
      );

      if (!context) {
        throw new Error(
          "Canvas is not supported in this browser"
        );
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality =
        "high";

      context.drawImage(
        loadedImage.source,
        0,
        0,
        dimensions.width,
        dimensions.height
      );

      const compressedBlob =
        await findBestCompressedBlob(
          canvas
        );

      if (
        compressedBlob &&
        compressedBlob.size <=
          IMAGE_HARD_MAX_BYTES
      ) {
        return new File(
          [compressedBlob],
          replaceFileExtension(
            originalFile.name,
            OUTPUT_IMAGE_EXTENSION
          ),
          {
            type: OUTPUT_IMAGE_TYPE,
            lastModified:
              originalFile.lastModified ||
              Date.now(),
          }
        );
      }

      /*
       * Quality কমিয়েও 400KB না হলে
       * resolution আরও কমাবে।
       */
      maxDimension = Math.floor(
        maxDimension * 0.82
      );
    }

    throw new Error(
      "Image could not be compressed below 400KB"
    );
  } finally {
    loadedImage.cleanup?.();
  }
};

const uploadImage = async (
  file,
  {
    mediaType = "product-image",
    productId,
    uploadSessionId,
  } = {}
) => {
  try {
    const validationError =
      validateOriginalFile(
        file,
        mediaType
      );

    if (validationError) {
      return {
        error: true,
        message: validationError,
      };
    }

    /*
     * Video আগের মতো original থাকবে।
     * শুধু image compress হবে।
     */
    const uploadFile =
      isVideoMediaType(mediaType)
        ? file
        : await compressImage(file);

    const contentType =
      getNormalizedContentType(uploadFile);

    const safeFileName =
      uploadFile.name ||
      `upload-${Date.now()}`;

    console.info(
      "Upload file prepared:",
      {
        originalName: file.name,
        originalSizeKB: Math.round(
          file.size / 1024
        ),
        uploadName: safeFileName,
        uploadSizeKB: Math.round(
          uploadFile.size / 1024
        ),
        uploadContentType: contentType,
      }
    );

    /*
     * 1. Backend থেকে presigned URL নেওয়া
     */
    const presignedResponse =
      await fetch(
        SummaryApi.media_presigned_upload
          .url,
        {
          method:
            SummaryApi
              .media_presigned_upload
              .method?.toUpperCase() ||
            "POST",

          headers: {
            "Content-Type":
              "application/json",
            ...getAuthHeaders(),
          },

          credentials: "include",

          body: JSON.stringify({
            fileName: safeFileName,
            contentType,
            fileSize: uploadFile.size,
            mediaType,

            ...(productId
              ? { productId }
              : {}),

            ...(uploadSessionId
              ? { uploadSessionId }
              : {}),
          }),
        }
      );

    const presignedResult =
      await parseJsonResponse(
        presignedResponse
      );

    const presignedData =
      presignedResult?.data;

    if (
      !presignedResponse.ok ||
      !presignedResult?.success ||
      !presignedData?.uploadUrl ||
      !presignedData?.key
    ) {
      console.error(
        "Presigned upload request failed:",
        presignedResponse.status
      );

      return {
        error: true,
        message: getSafeMessage(
          presignedResult?.message,
          "Could not create upload URL"
        ),
      };
    }

    /*
     * 2. Compressed image সরাসরি S3-তে upload
     */
    const s3Response = await fetch(
      presignedData.uploadUrl,
      {
        method:
          presignedData.method || "PUT",

        headers:
          presignedData.headers || {},

        body: uploadFile,

        credentials: "omit",
      }
    );

    if (!s3Response.ok) {
      console.error(
        "S3 upload failed:",
        s3Response.status
      );

      return {
        error: true,
        message: "File upload failed",
      };
    }

    /*
     * 3. Backend দিয়ে uploaded object verify
     */
    const confirmResponse =
      await fetch(
        SummaryApi.media_confirm_upload
          .url,
        {
          method:
            SummaryApi
              .media_confirm_upload
              .method?.toUpperCase() ||
            "POST",

          headers: {
            "Content-Type":
              "application/json",
            ...getAuthHeaders(),
          },

          credentials: "include",

          body: JSON.stringify({
            key: presignedData.key,
            expectedContentType:
              contentType,
            expectedMaxSize:
              getExpectedMaxSize(
                mediaType
              ),
          }),
        }
      );

    const confirmResult =
      await parseJsonResponse(
        confirmResponse
      );

    const confirmedData =
      confirmResult?.data;

    if (
      !confirmResponse.ok ||
      !confirmResult?.success ||
      !confirmedData?.url
    ) {
      console.error(
        "Upload confirmation failed:",
        confirmResponse.status
      );

      return {
        error: true,
        message: getSafeMessage(
          confirmResult?.message,
          "Upload confirmation failed"
        ),
      };
    }

    return {
      error: false,
      url: confirmedData.url,
      key: confirmedData.key,
      contentType:
        confirmedData.contentType,
      size: confirmedData.size,
      etag: confirmedData.etag,
      uploadSessionId:
        presignedData.uploadSessionId,
    };
  } catch (error) {
    console.error(
      "uploadImage-error:",
      error?.message
    );

    return {
      error: true,
      message:
        error?.message ||
        "Upload failed",
    };
  }
};

export default uploadImage;