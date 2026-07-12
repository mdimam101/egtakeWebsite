import React, { useEffect, useRef, useState } from "react";
import SummaryApi from "../common";
import { toast } from "react-toastify";
import uploadImage from "../helpers/uploadImage";
import "../styles/AllBanners.css"; // ✅ তোমার banner CSS এই ফাইলে রাখো

const AllBanners = () => {
  const [newBanner, setNewBanner] = useState({ imageUrl: "", altText: "" });
  const [previewImage, setPreviewImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [banners, setBanners] = useState([]);

  const fileRef = useRef(null);

  // 🟢 Fetch banners
  const fetchBanners = async () => {
    try {
      const res = await fetch(SummaryApi.get_banner.url, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setBanners(data.data || []);
      } else {
        toast.error(data.message || "Failed to fetch banners");
      }
    } catch  {
      console.log();
      toast.error("Failed to fetch banners");
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // 🟡 Upload image to cloud
  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadImage(file);
      if (!uploaded?.url) throw new Error("Upload failed");

      setNewBanner((prev) => ({ ...prev, imageUrl: uploaded.url }));
      setPreviewImage(uploaded.url);
      toast.success("Image uploaded successfully");
    } catch {
      console.log();
      toast.error("Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // 🔵 Submit new banner
  const handleUpload = async () => {
    if (!newBanner.imageUrl) return toast.warning("Please select an image");

    try {
      const res = await fetch(SummaryApi.upload_banner.url, {
        method: SummaryApi.upload_banner.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          imageUrl: newBanner.imageUrl,
          altText: (newBanner.altText || "").trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Banner uploaded");
        setNewBanner({ imageUrl: "", altText: "" });
        setPreviewImage("");
        if (fileRef.current) fileRef.current.value = "";
        fetchBanners();
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch {
      console.log();
      toast.error("Network error");
    }
  };

  // 🧹 Remove selected preview
  const clearPreview = () => {
    setNewBanner((prev) => ({ ...prev, imageUrl: "" }));
    setPreviewImage("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // 🔴 Delete banner
  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm("Delete this banner?")) return;

    try {
      const res = await fetch(SummaryApi.delete_banner.url, {
        method: SummaryApi.delete_banner.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bannerId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Deleted");
        fetchBanners();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch  {
      console.log();
      toast.error("Network error");
    }
  };

  return (
    <div className="banner-page">
      {/* Header */}
      <div className="banner-header">
        <div>
          <h2>🖼️ Banner Management</h2>
          <p className="banner-subtitle">
            Upload new homepage banners & manage existing ones
          </p>
        </div>
      </div>

      {/* Upload card */}
      <div className="banner-card">
        <div className="banner-card-title">Upload New Banner</div>

        <div className="banner-upload-row">
          {/* Drop area */}
          <div
            className={`banner-drop ${isUploading ? "disabled" : ""}`}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") fileRef.current?.click();
            }}
          >
            <div className="banner-drop-icon">⬆️</div>
            <div>
              <div className="banner-drop-strong">
                {isUploading ? "Uploading..." : "Click to choose image"}
              </div>
              <div className="banner-drop-muted">
                PNG/JPG recommended • banner will be shown on homepage slider
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
              style={{ display: "none" }}
            />
          </div>

          {/* Preview */}
          <div className="banner-preview">
            {previewImage ? (
              <>
                <button
                  type="button"
                  className="banner-preview-remove"
                  title="Remove preview"
                  onClick={clearPreview}
                >
                  ✕
                </button>
                <img src={previewImage} alt="Preview" />
              </>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "grid",
                  placeItems: "center",
                  padding: 12,
                }}
              >
                <div className="banner-preview-empty">No preview selected</div>
              </div>
            )}
          </div>
        </div>

        {/* Alt text + Upload */}
        <div className="banner-form-grid">
          <div className="banner-field">
            <label>Alt Text (optional)</label>
            <input
              type="text"
              placeholder="e.g., Winter sale banner"
              value={newBanner.altText}
              onChange={(e) =>
                setNewBanner((prev) => ({ ...prev, altText: e.target.value }))
              }
            />
          </div>

          <div className="banner-actions">
            <button
              className="banner-btn primary"
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !newBanner.imageUrl}
            >
              {isUploading ? "Uploading..." : "Upload Banner"}
            </button>
          </div>
        </div>
      </div>

      {/* List header */}
      <div className="banner-list-head">
        <h3>📋 All Banners</h3>
        <span className="banner-count">{banners.length} items</span>
      </div>

      {/* Grid */}
      {banners.length === 0 ? (
        <div className="banner-empty">No banners found</div>
      ) : (
        <div className="banner-grid">
          {banners.map((banner) => (
            <div key={banner._id} className="banner-item">
              <div className="banner-img-wrap">
                <img
                  src={banner.imageUrl}
                  alt={banner.altText || "Banner"}
                  loading="lazy"
                />
                <button
                  type="button"
                  className="banner-delete"
                  title="Delete"
                  onClick={() => handleDeleteBanner(banner._id)}
                >
                  ✕
                </button>
              </div>

              <div className="banner-meta">
                <div className="banner-alt">
                  {banner.altText?.trim() ? banner.altText : "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllBanners;
