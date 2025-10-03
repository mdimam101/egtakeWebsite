import React, { useEffect, useState } from "react";
import SummaryApi from "../common";
import { toast } from "react-toastify";
import uploadImage from "../helpers/uploadImage";

const AllBanners = () => {
  const [newBanner, setNewBanner] = useState({ imageUrl: "", altText: "" });
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [banners, setBanners] = useState([]);

  // 🟢 Fetch banners
  const fetchBanners = async () => {
    try {
      const res = await fetch(SummaryApi.get_banner.url);
      const data = await res.json();
      if (data.success) {
        setBanners(data.data || []);
      }
    } catch (err) {
        console.log(err);
        
      toast.error("Failed to fetch banners");
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // 🟡 Upload image to cloud
  const handleUploadProduct = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadImage(file);
      setNewBanner((prev) => ({ ...prev, imageUrl: uploaded.url }));
      setPreviewImage(uploaded.url);
      toast.success("Image uploaded successfully");
    } catch (err) {
        console.log(err);
      toast.error("Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // 🔵 Submit new banner
  const handleUpload = async () => {
    if (!newBanner.imageUrl) return toast.warning("Please select an image");

    const res = await fetch(SummaryApi.upload_banner.url, {
      method: SummaryApi.upload_banner.method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newBanner),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(data.message);
      setNewBanner({ imageUrl: "", altText: "" });
      setPreviewImage(null);
      fetchBanners(); // Reload list
    } else {
      toast.error(data.message);
    }
  };

  // 🔴 Delete banner
  const handleDeleteBanner = async (bannerId) => {
    const res = await fetch(SummaryApi.delete_banner.url, {
          method: SummaryApi.delete_banner.method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ bannerId }) 
        });
    const data = await res.json();
    
    if (data.success) {
      toast.success(data.message);
      fetchBanners(); // Reload list
    } else {
      toast.error(data.message);
    }
  };

  return (
    <div className="banner-admin">
      <h2>🖼️ Banner Management</h2>
      <div className="form">
        <input type="file" accept="image/*" onChange={handleUploadProduct} />

        {previewImage && (
          <div style={{ margin: "10px 0" }}>
            <img
              src={previewImage}
              alt="Preview"
              style={{ width: "200px", borderRadius: "8px" }}
            />
          </div>
        )}

        <input
          type="text"
          placeholder="Alt Text (optional)"
          value={newBanner.altText}
          onChange={(e) =>
            setNewBanner({ ...newBanner, altText: e.target.value })
          }
        />

        <button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload Banner"}
        </button>
      </div>

      <hr style={{ margin: "30px 0" }} />

      <h3>📋 All Banners</h3>
      <div className="banner-list" style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
  {banners.map((banner) => (
    <div key={banner._id} className="banner-item" style={{ position: "relative", width: "150px" }}>
      <img
        src={banner.imageUrl}
        alt={banner.altText || "Banner"}
        style={{
          width: "150px",
          height: "80px",
          objectFit: "cover",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        }}
      />
      <button
        onClick={() => handleDeleteBanner(banner._id)}
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          background: "rgba(255, 0, 0, 0.8)",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "14px",
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
        title="Remove"
      >
        ✕
      </button>
      <p style={{ textAlign: "center", marginTop: "5px", fontSize: "14px" }}>
        {banner.altText}
      </p>
    </div>
  ))}
</div>
    </div>
  );
};

export default AllBanners;
