import React, { useState, useEffect } from "react";
import type { IEvent } from "./EventsTable";
import "./AdminModal.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { showSnackbar } from "../../../utils/snackbar";

dayjs.extend(utc);

interface Props {
  event: IEvent | null; // null means create mode
  onClose: () => void;
  onSuccess: () => void;
}

export const EventFormModal: React.FC<Props> = ({ event, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    date: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description,
        price: event.price.toString(),
        date: event.date.substring(0, 10),
      });
      if (event.imgUrl) {
        setPreviewUrl(event.imgUrl);
      }
    }
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      const isEdit = !!event;
      const method = isEdit ? "PUT" : "POST";

      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("description", formData.description);
      payload.append("price", formData.price);
      payload.append("date", formData.date);

      if (isEdit) {
        payload.append("id", event.id.toString());
      }

      if (isImageDeleted) {
        payload.append("deleteImage", "true");
      }

      if (selectedFile) {
        payload.append("image", selectedFile);
      }

      const res = await fetch("/api/admin/events", {
        method,
        body: payload,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error((errData as { error: string }).error || "Failed to save event");
      }

      onSuccess();
      showSnackbar(event ? "Event updated successfully" : "Event created successfully", "success");
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
          <h3>{event ? "Edit Event" : "Create Event"}</h3>
          <button className="admin-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="admin-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="form-content">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
              />
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label htmlFor="price">Price (EUR)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  value={dayjs.utc(formData.date).local().format("YYYY-MM-DDTHH:mm")}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Event Image</label>
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
                      <p style={{ color: "var(--gray-500)", margin: "0 0 1rem 0" }}>
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
              {isSubmitting ? "Saving..." : "Save Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
