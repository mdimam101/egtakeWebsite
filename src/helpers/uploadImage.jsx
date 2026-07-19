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
  const browserType = String(
    file?.type || ""
  )
    .trim()
    .toLowerCase();

  const extensionType =
    MIME_BY_EXTENSION[
      getFileExtension(file?.name)
    ] || "";

  const normalizedTypes = {
    "image/heic-sequence": "image/heic",
    "image/heif-sequence": "image/heif",
  };

  if (
    !browserType ||
    browserType ===
      "application/octet-stream" ||
    browserType ===
      "binary/octet-stream"
  ) {
    return extensionType;
  }

  return (
    normalizedTypes[browserType] ||
    browserType
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

const RETRYABLE_HTTP_STATUSES = new Set([
  408,
  425,
  429,
  500,
  502,
  503,
  504,
]);

const RETRY_DELAYS_MS = [350, 900];

const wait = (milliseconds) =>
  new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );

const getResponseRequestId = (response) =>
  response?.headers?.get?.("x-request-id") ||
  response?.headers?.get?.("x-amz-request-id") ||
  "";

const createUploadError = (
  stage,
  message,
  {
    status,
    requestId,
    cause,
  } = {}
) => {
  const error = new Error(message);
  error.stage = stage;
  error.status = status;
  error.requestId = requestId;
  error.cause = cause;
  return error;
};

const fetchWithRetry = async (
  url,
  options,
  {
    stage,
    retries = 2,
    timeoutMs = 20000,
  }
) => {
  let lastError;

  for (
    let attempt = 0;
    attempt <= retries;
    attempt += 1
  ) {
    const controller =
      new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      timeoutMs
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const shouldRetry =
        !response.ok &&
        RETRYABLE_HTTP_STATUSES.has(
          response.status
        ) &&
        attempt < retries;

      if (!shouldRetry) {
        return response;
      }

      lastError = createUploadError(
        stage,
        `${stage} failed with HTTP ${response.status}`,
        {
          status: response.status,
          requestId:
            getResponseRequestId(response),
        }
      );
    } catch (error) {
      clearTimeout(timeoutId);

      const message =
        error?.name === "AbortError"
          ? `${stage} timed out`
          : `${stage} network error`;

      lastError = createUploadError(
        stage,
        message,
        {
          cause: error,
        }
      );

      if (attempt >= retries) {
        throw lastError;
      }
    }

    await wait(
      RETRY_DELAYS_MS[
        Math.min(
          attempt,
          RETRY_DELAYS_MS.length - 1
        )
      ]
    );
  }

  throw (
    lastError ||
    createUploadError(
      stage,
      `${stage} failed`
    )
  );
};

const createFailureResult = (
  stage,
  message,
  response
) => ({
  error: true,
  stage,
  status: response?.status,
  requestId:
    getResponseRequestId(response),
  message,
});

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
      return createFailureResult(
        "VALIDATION_FAILED",
        validationError
      );
    }

    let uploadFile;

    try {
      uploadFile =
        isVideoMediaType(mediaType)
          ? file
          : await compressImage(file);
    } catch (error) {
      console.error(
        "Image preparation failed:",
        error
      );

      return createFailureResult(
        "COMPRESSION_FAILED",
        error?.message ||
          "Image preparation failed"
      );
    }

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

    const presignedResponse =
      await fetchWithRetry(
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
        },
        {
          stage: "PRESIGN_FAILED",
          retries: 2,
          timeoutMs: 15000,
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
        {
          status:
            presignedResponse.status,
          requestId:
            getResponseRequestId(
              presignedResponse
            ),
          result: presignedResult,
        }
      );

      return createFailureResult(
        "PRESIGN_FAILED",
        getSafeMessage(
          presignedResult?.message,
          "Could not create upload URL"
        ),
        presignedResponse
      );
    }

    const s3Response =
      await fetchWithRetry(
        presignedData.uploadUrl,
        {
          method:
            presignedData.method || "PUT",
          headers:
            presignedData.headers || {},
          body: uploadFile,
          credentials: "omit",
        },
        {
          stage: "S3_PUT_FAILED",
          retries: 2,
          timeoutMs:
            isVideoMediaType(mediaType)
              ? 120000
              : 30000,
        }
      );

    if (!s3Response.ok) {
      const s3ErrorBody =
        await s3Response
          .text()
          .catch(() => "");

      console.error(
        "S3 upload failed:",
        {
          status: s3Response.status,
          requestId:
            getResponseRequestId(
              s3Response
            ),
          body: s3ErrorBody.slice(0, 500),
        }
      );

      return createFailureResult(
        "S3_PUT_FAILED",
        `File upload failed (HTTP ${s3Response.status})`,
        s3Response
      );
    }

    const confirmResponse =
      await fetchWithRetry(
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
        },
        {
          stage: "CONFIRM_FAILED",
          retries: 2,
          timeoutMs: 15000,
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
        {
          status:
            confirmResponse.status,
          requestId:
            getResponseRequestId(
              confirmResponse
            ),
          result: confirmResult,
          key: presignedData.key,
        }
      );

      return createFailureResult(
        confirmResponse.status === 401
          ? "AUTH_FAILED"
          : "CONFIRM_FAILED",
        getSafeMessage(
          confirmResult?.message,
          "Upload confirmation failed"
        ),
        confirmResponse
      );
    }

    return {
      error: false,
      stage: "COMPLETED",
      url: confirmedData.url,
      key: confirmedData.key,
      contentType:
        confirmedData.contentType,
      size: confirmedData.size,
      etag: confirmedData.etag,
      uploadSessionId:
        presignedData.uploadSessionId,
      requestId:
        getResponseRequestId(
          confirmResponse
        ),
    };
  } catch (error) {
    console.error(
      "uploadImage-error:",
      {
        stage: error?.stage,
        status: error?.status,
        requestId: error?.requestId,
        message: error?.message,
        error,
      }
    );

    return {
      error: true,
      stage:
        error?.stage ||
        "UPLOAD_FAILED",
      status: error?.status,
      requestId: error?.requestId,
      message:
        error?.message ||
        "Upload failed",
    };
  }
};

export default uploadImage;