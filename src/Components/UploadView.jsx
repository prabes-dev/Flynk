import AllowedFileTypes from "./AllowedFileTypes";
import { Settings, Upload } from "lucide-react";
import { supabase } from "./SupaBase";
import { useState } from "react";

const UploadView = ({ uploadSettings, setUploadSettings, setDragActive, dragActive, setUploadProgress, setIsUploading, setNotification, setUploadedFiles, fileInputRef,isUploading,uploadProgress }) => {
  
  
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileURL, setFileURL] = useState("");

  // This function handles drag and drop events.
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

// Fixed showNotification function with proper error checking
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



    // This function checks if the file type is allowed and if the file size is within the limit.
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



  
  // This function processes the selected files, validates them, and initiates the upload.
  const handleFiles = (files) => {
    const validFiles = files.filter(validateFile);
    if (validFiles.length > 0) {
      handleUpload(validFiles);
    }  
  };  
  
  

const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };  

  const handleUpload = async () => {
    try{
      setUploading(true);

      if (!file) {
        showNotification("No file selected for upload.", "error");
        return;
      }  

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      console.log("File upload data:", data);

        if (error) {
          throw error;
        }  
      const {data: url } = await supabase.storage  
        .from('uploads')
        .getPublicUrl(filePath); 

      setFileURL(url.publicUrl);  
      showNotification("File uploaded successfully!", "success");
    }  
    catch(error){
      console.error("Error setting uploading state:", error);
      showNotification("Failed to set uploading state. Please try again.", "error");
    }  
    finally {
      setUploading(false);
    }  
  }  
  



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
                  expiresInHours: parseInt(e.target.value),
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
                maxDownloads: parseInt(e.target.value),
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
  )
}

export default UploadView