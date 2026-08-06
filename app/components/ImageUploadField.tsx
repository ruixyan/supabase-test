"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useRef, useState } from "react";

type Props = {
  label?: string;
  bucket: string;
  value: string;
  onChange: (url: string) => void;

  folder?: string;
  disabled?: boolean;
  required?: boolean;
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #bdbdbd",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box" as const,
};

export default function ImageUploadField({
  label = "Image",
  bucket,
  value,
  onChange,
  folder = "",
  disabled = false,
  required = false,
}: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  function handleFileSelection(file: File | null) {
    setSelectedFile(file);
    setMessage("");

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!file) {
      setPreviewUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      setSelectedFile(null);
      setPreviewUrl("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);
  }

  function createStoragePath(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

    const safeBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    const uniquePart = `${Date.now()}-${crypto.randomUUID()}`;
    const fileName = `${safeBaseName || "image"}-${uniquePart}.${extension}`;

    const cleanedFolder = folder
      .trim()
      .replace(/^\/+|\/+$/g, "");

    return cleanedFolder
      ? `${cleanedFolder}/${fileName}`
      : fileName;
  }

  async function uploadImage() {
    if (!selectedFile) {
      setMessage("Please choose an image first.");
      return;
    }

    setUploading(true);
    setMessage("");

    const storagePath = createStoragePath(selectedFile);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: selectedFile.type,
      });

    if (uploadError) {
      setMessage(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    onChange(publicUrl);
    setMessage("Image uploaded.");

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setUploading(false);
  }

  function clearImage() {
    onChange("");
    setSelectedFile(null);
    setMessage("");

    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const displayedImageUrl = previewUrl || value;

  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        {label}
        {required ? " *" : ""}
      </label>

      <div
        style={{
          padding: "14px",
          border: "1px solid #bdbdbd",
          background: "#fafafa",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          disabled={disabled || uploading}
          onChange={(event) =>
            handleFileSelection(event.target.files?.[0] || null)
          }
          style={{
            ...inputStyle,
            padding: "8px",
            background: "white",
          }}
        />

        {selectedFile && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginTop: "10px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#555",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedFile.name}
            </p>

            <button
              type="button"
              disabled={disabled || uploading}
              onClick={uploadImage}
              style={{
                flexShrink: 0,
                padding: "8px 12px",
                border: "1px solid #9c1515",
                background: "#9c1515",
                color: "white",
                cursor:
                  disabled || uploading
                    ? "default"
                    : "pointer",
                opacity: disabled || uploading ? 0.6 : 1,
                fontSize: "13px",
              }}
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: "16px 0",
          }}
        >
          <div
            style={{
              height: "1px",
              background: "#ddd",
              flex: 1,
            }}
          />

          <span
            style={{
              fontSize: "12px",
              color: "#777",
            }}
          >
            OR
          </span>

          <div
            style={{
              height: "1px",
              background: "#ddd",
              flex: 1,
            }}
          />
        </div>

        <input
          type="url"
          value={value}
          disabled={disabled || uploading}
          required={required && !selectedFile}
          onChange={(event) => {
            onChange(event.target.value);
            setMessage("");
          }}
          placeholder="External image URL"
          style={{
            ...inputStyle,
            background: "white",
          }}
        />

        {displayedImageUrl && (
          <div
            style={{
              marginTop: "14px",
            }}
          >
            <p
              style={{
                margin: "0 0 8px 0",
                fontSize: "12px",
                color: "#555",
              }}
            >
              Preview
            </p>

            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "320px",
                aspectRatio: "1 / 1",
                overflow: "hidden",
                border: "1px solid #ddd",
                background: "#f3f3f3",
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Selected image preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Image
                  src={value}
                  alt="Image preview"
                  fill
                  unoptimized
                  style={{
                    objectFit: "cover",
                  }}
                />
              )}
            </div>

            <button
              type="button"
              disabled={disabled || uploading}
              onClick={clearImage}
              style={{
                marginTop: "8px",
                padding: "7px 10px",
                border: "1px solid #bdbdbd",
                background: "white",
                color: "black",
                cursor:
                  disabled || uploading
                    ? "default"
                    : "pointer",
                fontSize: "12px",
              }}
            >
              Clear Image
            </button>
          </div>
        )}

        {message && (
          <p
            style={{
              margin: "10px 0 0 0",
              fontSize: "13px",
              color:
                message === "Image uploaded."
                  ? "#444"
                  : "#9c1515",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}