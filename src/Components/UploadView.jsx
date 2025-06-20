import AllowedFileTypes from "./AllowedFileTypes";
import { Upload, AlertCircle } from "lucide-react";
import { useState } from "react";

const UploadView = ({
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

  // Improved notification function with better error handling
  const showNotification = (message, type = "success") => {
    try {
      if (typeof setNotification === "function") {
        setNotification({ message, type });
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          setNotification(null);
        }, 5000);
      } else {
        console.warn("setNotification is not a function");
        console.log(`Notification: ${type.toUpperCase()} - ${message}`);
      }
    } catch (error) {
      console.error("Error showing notification:", error);
      console.log(`Fallback notification: ${type.toUpperCase()} - ${message}`);
    }
  };

  // File size limits
  const goFileMaxSize = 5 * 1024 * 1024 * 1024;

  // Validate individual file
  const validateFile = (file) => {
    if (!AllowedFileTypes.includes(file.type)) {
      showNotification(`File type ${file.type} is not allowed`, "error");
      return false;
    }
    if (file.size > goFileMaxSize) {
      showNotification(`File size must be less than 5GB`, "error");
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









  // Upload function for GoFile with better error handling
  const uploadToGoFile = async (file) => {
    const token = import.meta.env.VITE_GOFILE_API_TOKEN;

    // Check if token exists
    if (!token) {
      const error = "GoFile API token is missing. Please check your environment variables.";
      console.error(error);
      throw new Error(error);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("token", token);

    try {
      console.log("Getting GoFile server...");
      
      // First get the best server to upload to
      const serverResponse = await fetch("https://api.gofile.io/servers");
      
      if (!serverResponse.ok) {
        throw new Error(`Server request failed: ${serverResponse.status} ${serverResponse.statusText}`);
      }
      
      const serverJson = await serverResponse.json();
      
      if (serverJson.status !== "ok") {
        throw new Error(`Failed to get upload server: ${serverJson.status}`);
      }
      
      const server = serverJson.data.server;
      console.log("Got server:", server);
      
      // Now upload to the recommended server
      const uploadUrl = `https://upload.gofile.io/uploadfile`;
      console.log("Uploading to:", uploadUrl);
      
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Upload failed with response:", errorText);
        throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${errorText}`);
      }

      const responseText = await res.text();
      console.log("Raw response:", responseText);

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", responseText);
        throw new Error(`Invalid JSON response: ${responseText}`, parseError);
      }

      if (json.status === "ok") {
        const downloadPage = json.data.downloadPage;
        const fileId = json.data.fileId;
        
        console.log("File uploaded successfully!");
        console.log("Download page:", downloadPage);
        console.log("File ID:", fileId);

        return {
          fileUrl: downloadPage,
          fileName: file.name,
          fileId: fileId,
          uploadedAt: new Date().toISOString()
        };
      } else {
        console.error("Upload failed with status:", json.status);
        throw new Error(`Upload failed: ${json.status}`);
      }
    } catch (err) {
      console.error("Upload error details:", err);
      throw err; // Re-throw to be handled by the calling function
    }
  };








  // Main upload function with improved error handling
  const handleUpload = async (files) => {
    if (!files || files.length === 0) {
      showNotification("No files selected for upload.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedFiles = [];
      const totalFiles = files.length;
      let completedFiles = 0;

      console.log(`Uploading ${totalFiles} file(s) to GoFile`);

      // Upload all files to GoFile
      for (const file of files) {
        try {
          const uploadedFile = await uploadToGoFile(file);
          
          if (uploadedFile) {
            uploadedFiles.push(uploadedFile);
            console.log(`Successfully uploaded: ${file.name}`, uploadedFile);
          }
          
        } catch (error) {
          console.error(`Failed to upload ${file.name} to GoFile:`, error);
          showNotification(`Failed to upload ${file.name}: ${error.message}`, "error");
        }
        
        completedFiles++;
        setUploadProgress((completedFiles / totalFiles) * 100);
      }

      // Update uploaded files list
      if (uploadedFiles.length > 0) {
        setUploadedFiles((prev) => [...(prev || []), ...uploadedFiles]);
      }
      
      // Show success notification
      const successCount = uploadedFiles.length;
      const failedCount = files.length - successCount;
      
      if (successCount > 0) {
        let message = `${successCount} file(s) uploaded successfully! Files will be available for 30 days.`;
        showNotification(message, "success");
      }
      
      if (failedCount > 0) {
        showNotification(`${failedCount} file(s) failed to upload`, "error");
      }

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
          Upload your files and get shareable links instantly. Files are stored for 30 days.
        </p>
      </div>

      {/* Environment Variable Warning */}
      {!import.meta.env.VITE_GOFILE_API_TOKEN && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="text-red-800">
              <strong>Configuration Required:</strong> GoFile API token is missing. 
              Please add VITE_GOFILE_API_TOKEN to your environment variables.
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg border border-blue-200/60 p-6 backdrop-blur-sm">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800">File Storage Info</h3>
        </div>
        <div className="text-sm text-slate-600 space-y-1">
          <p>• All files are automatically stored for <strong>30 days</strong></p>
          <p>• Files are securely hosted and accessible worldwide</p>
          <p>• Maximum file size: <strong>5GB per file</strong></p>
          <p>• Share your files with anyone using the generated links</p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
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
            <p>Max file size: 5GB (auto-routed to best service)</p>
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