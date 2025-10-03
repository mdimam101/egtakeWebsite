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
const cloudName = import.meta.env.VITE_CLOUD_NAME_CLOUDINARY;
const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "qcommerce_product";
// Optional: client-side guard
const MAX_BYTES = Number(import.meta.env.VITE_CLOUDINARY_MAX_BYTES) || 10485760; // 10MB default

// ❗ আগের /image/upload → এখন /auto/upload (image + video)
const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

const uploadImage = async (file) => {
  try {
    if (!file) return { error: true, message: "No file selected" };

    // Optional: client-side size guard (preset-এও limit বড়াতে হবে)
    if (file.size && file.size > MAX_BYTES) {
      return {
        error: true,
        message: `File too large (${(file.size / 1024 / 1024).toFixed(
          1
        )}MB). Max ${(MAX_BYTES / 1024 / 1024).toFixed(1)}MB.`,
      };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    const res = await fetch(url, { method: "POST", body: formData });
    const result = await res.json();

    // Cloudinary error pass-through
    if (!res.ok || result?.error) {
      return { error: true, message: result?.error?.message || "Upload failed" };
    }

    // normalize → আগের কোডে uploaded.url ব্যবহার হচ্ছে
    if (!result.url && result.secure_url) result.url = result.secure_url;

    return result;
  } catch (error) {
    console.error("uploadImage-error", error);
    return { error: true, message: error?.message || "Upload failed" };
  }
};

export default uploadImage;
