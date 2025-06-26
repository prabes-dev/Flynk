import AllowedFileTypes from "./AllowedFileTypes";
import { Settings, Upload } from "lucide-react";
import { supabase } from "./SupaBase";
import { useState } from "react";

const UploadView = ({
  uploadSettings,
  setUploadSettings,
  setDragActive,
  dragActive,
  setUploadProgress,
  setIsUploading,
  setNotification,
  setUploadedFiles,
  fileInputRef,
  isUploading,
  uploadProgress,
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Handle drag and drop events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  // Fixed showNotification function
  const showNotification = (message, type = "success") => {
    try {
      setNotification({ message, type });
      setTimeout(() => {
        if (typeof setNotification === "function") {
          setNotification(null);
        }
      }, 5000);
    } catch (error) {
      console.error("Error showing notification:", error);
      console.log(`Fallback notification: ${type.toUpperCase()} - ${message}`);
    }
  };

  // Maximum file size limit
  const maxFileSize = 50 * 1024 * 1024;

  // Validate individual file
  const validateFile = (file) => {
    if (!AllowedFileTypes.includes(file.type)) {
      showNotification(`File type ${file.type} is not allowed`, "error");
      return false;
    }
    if (file.size > maxFileSize) {
      showNotification(`File size must be less than 50MB`, "error");
      return false;
    }
    return true;
  };

  // Process selected files and start upload
  const handleFiles = (files) => {
    const validFiles = files.filter(validateFile);
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      handleUpload(validFiles);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  // Upload files to Supabase
  const handleUpload = async (files) => {
    if (!files || files.length === 0) {
      showNotification("No files selected for upload.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name;
        const filePath = `${fileName}`;

        // Update progress for current file
        const baseProgress = (i / files.length) * 100;
        setUploadProgress(baseProgress);

        const { data, error } = await supabase.storage
          .from("uploads")
          .upload(filePath, file, {upsert: false});
        console.log("data:", data);
        if (error) {
          throw error;
        }

        const { data: urlData } = await supabase.storage
          .from("uploads")
          .getPublicUrl(filePath);

        uploadedFiles.push({
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type,
        });

        // Update progress after each file
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      // Update uploaded files list
      setUploadedFiles((prev) => [...(prev || []), ...uploadedFiles]);
      showNotification(
        `${files.length} file(s) uploaded successfully!`,
        "success"
      );

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFiles([]);
    } catch (error) {
      console.error("Upload error:", error);
      showNotification("Upload failed. Please try again.", "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Share Files Securely
        </h2>
        <p className="text-gray-600">
          Upload your files and get shareable links instantly. No registration
          required.
        </p>
      </div>

      {/* Upload Settings */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl shadow-lg border border-slate-200/60 p-8 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center text-slate-800">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mr-3 shadow-md">
            <Settings className="w-5 h-5 text-white" />
          </div>
          Upload Settings <p className="ml-4 text-xs text-slate-500">(Currently in development)</p>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="group relative flex items-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60 hover:bg-white/90 hover:border-blue-300/60 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={uploadSettings.isTemporary}
                  onChange={(e) =>
                    setUploadSettings((prev) => ({
                      ...prev,
                      isTemporary: e.target.checked,
                    }))
                  }
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                    uploadSettings.isTemporary
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 border-transparent shadow-sm"
                      : "border-slate-300 group-hover:border-blue-400"
                  }`}
                >
                  {uploadSettings.isTemporary && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <span className="font-medium text-slate-800">
                  Temporary file
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  File will auto-delete after expiration
                </p>
              </div>
            </label>
          </div>

          {uploadSettings.isTemporary && (
            <div className="space-y-2 animate-in slide-in-from-right duration-300">
              <label className="flex gap-10 items-center text-sm font-semibold text-slate-700 mb-2">
                <p>Expires in hours</p>
                <p className="text-xs text-slate-500">
                  Maximum 168 hours (7 days)
                </p>
              </label>

              <div className="relative">
                <input
                  type="number"
                  value={uploadSettings.expiresInHours}
                  onChange={(e) =>
                    setUploadSettings((prev) => ({
                      ...prev,
                      expiresInHours: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-slate-800 font-medium shadow-sm hover:bg-white/90"
                  min="1"
                  max="168"
                  placeholder="24"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-slate-400 text-sm font-medium">
                    hrs
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept={AllowedFileTypes.join(",")}
          disabled={isUploading}
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-white" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {dragActive ? "Drop files here" : "Drag & drop files here"}
            </h3>
            <p className="text-gray-500 mt-1">or click to browse</p>
          </div>

          <div className="text-sm text-gray-500">
            <p>Supported: Images, PDFs, Documents, Archives, Videos</p>
            <p>Max file size: 50MB</p>
            {selectedFiles.length > 0 && (
              <p>{selectedFiles.length} file(s) selected</p>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="fixed top-4 right-4 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/60 p-4 min-w-[280px] animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-slate-800">Uploading files...</span>
            </div>
            <span className="text-sm font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
              {Math.round(uploadProgress)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Please don't close this window
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadView;
