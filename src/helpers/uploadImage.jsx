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





import SummaryApi from "../common";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

const getSafeMessage = (message, fallback = "Upload failed") =>
  typeof message === "string" && message.trim() ? message : fallback;

const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

const isVideoMediaType = (mediaType) => mediaType === "product-video";

const getExpectedMaxSize = (mediaType) =>
  isVideoMediaType(mediaType) ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;

const validateFile = (file, mediaType) => {
  if (!file) {
    return "No file selected";
  }

  if (!file.size) {
    return "Empty file is not allowed";
  }

  const allowedTypes = isVideoMediaType(mediaType)
    ? VIDEO_TYPES
    : IMAGE_TYPES;

  const maxSize = getExpectedMaxSize(mediaType);

  if (!allowedTypes.includes(file.type)) {
    return isVideoMediaType(mediaType)
      ? "Only MP4, WebM, or QuickTime videos are allowed"
      : "Only JPEG, PNG, or WebP images are allowed";
  }

  if (file.size > maxSize) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(
      1
    )}MB). Max ${(maxSize / 1024 / 1024).toFixed(1)}MB.`;
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

const uploadImage = async (
  file,
  {
    mediaType = "product-image",
    productId,
    uploadSessionId,
  } = {}
) => {
  try {
    const validationError = validateFile(file, mediaType);

    if (validationError) {
      return {
        error: true,
        message: validationError,
      };
    }

    // 1. Backend থেকে presigned URL নেওয়া
    const presignedResponse = await fetch(
      SummaryApi.media_presigned_upload.url,
      {
        method:
          SummaryApi.media_presigned_upload.method?.toUpperCase() || "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          mediaType,
          ...(productId ? { productId } : {}),
          ...(uploadSessionId ? { uploadSessionId } : {}),
        }),
      }
    );

    const presignedResult = await parseJsonResponse(presignedResponse);
    const presignedData = presignedResult?.data;

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

    // 2. File সরাসরি S3-তে upload করা
    const s3Response = await fetch(presignedData.uploadUrl, {
      method: presignedData.method || "PUT",
      headers: presignedData.headers || {},
      body: file,
      credentials: "omit",
    });

    if (!s3Response.ok) {
      console.error("S3 upload failed:", s3Response.status);

      return {
        error: true,
        message: "File upload failed",
      };
    }

    // 3. Backend দিয়ে আসল uploaded object verify করা
    const confirmResponse = await fetch(
      SummaryApi.media_confirm_upload.url,
      {
        method:
          SummaryApi.media_confirm_upload.method?.toUpperCase() || "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          key: presignedData.key,
          expectedContentType: file.type,
          expectedMaxSize: getExpectedMaxSize(mediaType),
        }),
      }
    );

    const confirmResult = await parseJsonResponse(confirmResponse);
    const confirmedData = confirmResult?.data;

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
      contentType: confirmedData.contentType,
      size: confirmedData.size,
      etag: confirmedData.etag,
      uploadSessionId: presignedData.uploadSessionId,
    };
  } catch (error) {
    console.error("uploadImage-error:", error?.message);

    return {
      error: true,
      message: "Upload failed",
    };
  }
};

export default uploadImage;