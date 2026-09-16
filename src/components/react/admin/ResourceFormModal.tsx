import React, { useState, useEffect } from "react";
import type { IResource } from "./ResourcesTable";
import "./AdminModal.css";
import { showSnackbar } from "../../../utils/snackbar";

interface Props {
  resource: IResource | null; // null means create mode
  onClose: () => void;
  onSuccess: () => void;
}

export const ResourceFormModal: React.FC<Props> = ({ resource, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isVideo: false,
    url: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name,
        description: resource.description || "",
        isVideo: resource.isVideo,
        url: resource.url || "",
      });
      if (resource.imgUrl) {
        setPreviewUrl(resource.imgUrl);
      }
    }
  }, [resource]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setFormData({ ...formData, [target.name]: target.checked });
    } else {
      setFormData({ ...formData, [target.name]: target.value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsImageDeleted(false);
    }
  };

  const handleDeleteImage = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsImageDeleted(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const isEdit = !!resource;
      const method = isEdit ? "PUT" : "POST";

      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("description", formData.description);
      payload.append("isVideo", formData.isVideo.toString());
      if (formData.isVideo) {
        payload.append("url", formData.url);
      }

      if (isEdit) {
        payload.append("id", resource.id.toString());
      }

      if (isImageDeleted) {
        payload.append("deleteImage", "true");
      }

      if (selectedFile) {
        payload.append("image", selectedFile);
      }

      const res = await fetch("/api/admin/resources", {
        method,
        body: payload,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error((errData as { error: string }).error || "Failed to save resource");
      }

      onSuccess();
      showSnackbar(
        resource ? "Resource updated successfully" : "Resource created successfully",
        "success",
      );
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      showSnackbar(err.message || "An unexpected error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent clicks inside modal from closing it
  const handleModalClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal-content" onClick={handleModalClick}>
        <div className="admin-modal-header">
          <h3>{resource ? "Edit Resource" : "Create Resource"}</h3>
          <button className="admin-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="admin-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="form-content">
            <div className="form-group">
              <label htmlFor="resource-name">Name</label>
              <input
                type="text"
                id="resource-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="resource-description">Description</label>
              <textarea
                id="resource-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label
                htmlFor="resource-isVideo"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  id="resource-isVideo"
                  name="isVideo"
                  checked={formData.isVideo}
                  onChange={handleChange}
                  style={{ width: "auto", accentColor: "var(--primary-500)" }}
                />
                This is a video resource
              </label>
            </div>

            {formData.isVideo && (
              <div className="form-group">
                <label htmlFor="resource-url">YouTube URL</label>
                <input
                  type="url"
                  id="resource-url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Resource Image</label>
              <div className="image-upload-container">
                {previewUrl && !isImageDeleted ? (
                  <div className="image-preview-wrapper">
                    <img src={previewUrl} alt="Preview" className="image-preview" />
                    <div className="image-actions">
                      <label className="admin-action-btn outline cursor-pointer text-center">
                        Change Image
                        <input
                          type="file"
                          accept="image/jpeg, image/png, image/webp"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                      </label>
                      <button
                        type="button"
                        className="admin-action-btn delete"
                        onClick={handleDeleteImage}
                      >
                        Delete Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="image-placeholder">
                    <div className="placeholder-content">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ opacity: 0.5, marginBottom: "0.5rem" }}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <p
                        style={{
                          color: "var(--gray-500)",
                          margin: "0 0 1rem 0",
                        }}
                      >
                        No image selected
                      </p>
                      <label className="admin-action-btn">
                        Add Image
                        <input
                          type="file"
                          accept="image/jpeg, image/png, image/webp"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="admin-modal-footer">
            <button
              type="button"
              className="admin-action-btn outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="admin-action-btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
