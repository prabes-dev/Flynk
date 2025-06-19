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
  uploadProgress 
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
        if (typeof setNotification === 'function') {
          setNotification(null);
        }
      }, 5000);
    } catch (error) {
      console.error('Error showing notification:', error);
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
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${i}.${fileExt}`;
        const filePath = `${fileName}`;

        // Update progress for current file
        const baseProgress = (i / files.length) * 100;
        setUploadProgress(baseProgress);

        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(filePath, file);
        console.log("data:", data);
        if (error) {
          throw error;
        }

        const { data: urlData } = await supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type
        });

        // Update progress after each file
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      // Update uploaded files list
      setUploadedFiles(prev => [...(prev || []), ...uploadedFiles]);
      showNotification(`${files.length} file(s) uploaded successfully!`, "success");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Upload Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={uploadSettings.isTemporary}
                onChange={(e) =>
                  setUploadSettings((prev) => ({
                    ...prev,
                    isTemporary: e.target.checked,
                  }))
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm">Temporary file</span>
            </label>
          </div>

          {uploadSettings.isTemporary && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Expires in hours
              </label>
              <input
                type="number"
                value={uploadSettings.expiresInHours}
                onChange={(e) =>
                  setUploadSettings((prev) => ({
                    ...prev,
                    expiresInHours: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="168"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Password (optional)
            </label>
            <input
              type="password"
              value={uploadSettings.password}
              onChange={(e) =>
                setUploadSettings((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Leave empty for no password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Max downloads (0 = unlimited)
            </label>
            <input
              type="number"
              value={uploadSettings.maxDownloads}
              onChange={(e) =>
                setUploadSettings((prev) => ({
                  ...prev,
                  maxDownloads: parseInt(e.target.value) || 0,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>
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
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Uploading...</span>
            <span className="text-sm text-gray-500">
              {Math.round(uploadProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadView;