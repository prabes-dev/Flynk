import { useState, useEffect } from "react";
import { supabase } from "./SupaBase";
import {
  Trash2,
  Eye,
  Download,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  Link,
  Search,
  RefreshCw,
  Check,
  AlertCircle,
  MoreVertical,
} from "lucide-react";

const FilesView = () => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedFileId, setCopiedFileId] = useState(null);
  const [showActionsFor, setShowActionsFor] = useState(null);

  const BUCKET_NAME = "uploads";

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    const filtered = files.filter((file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFiles(filtered);
  }, [files, searchTerm]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list("", {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;

      // Get file URLs and additional info
      const filesWithUrls = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(file.name);

          return {
            ...file,
            url: urlData.publicUrl,
            size: formatFileSize(file.metadata?.size || 0),
            type: getFileType(file.name),
            id: file.name, // Using filename as unique ID
          };
        })
      );

      setFiles(filesWithUrls);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileName) => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      return;
    }

    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);

      if (error) throw error;

      // Remove file from state
      setFiles(files.filter((file) => file.name !== fileName));

      // Close preview if deleted file was being previewed
      if (selectedFile?.name === fileName) {
        setShowPreview(false);
        setSelectedFile(null);
      }
      setShowActionsFor(null);
    } catch (err) {
      alert(`Error deleting file: ${err.message}`);
    }
  };

  const viewFile = (file) => {
    setSelectedFile(file);
    setShowPreview(true);
    setShowActionsFor(null);
  };

  const downloadFile = async (file) => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(file.name);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowActionsFor(null);
    } catch (err) {
      alert(`Error downloading file: ${err.message}`);
    }
  };

  const copyFileLink = async (file) => {
    try {
      await navigator.clipboard.writeText(file.url);
      setCopiedFileId(file.id);
      setTimeout(() => setCopiedFileId(null), 2000);
      setShowActionsFor(null);
    } catch (error) {
      alert("Failed to copy link to clipboard", error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileType = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    const videoTypes = ["mp4", "avi", "mov", "wmv", "flv", "webm"];
    const audioTypes = ["mp3", "wav", "ogg", "aac", "flac"];
    const archiveTypes = ["zip", "rar", "7z", "tar", "gz"];

    if (imageTypes.includes(extension)) return "image";
    if (videoTypes.includes(extension)) return "video";
    if (audioTypes.includes(extension)) return "audio";
    if (archiveTypes.includes(extension)) return "archive";
    return "document";
  };

  const getFileIcon = (type) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case "image":
        return <Image className={`${iconClass} text-green-600`} />;
      case "video":
        return <Film className={`${iconClass} text-purple-600`} />;
      case "audio":
        return <Music className={`${iconClass} text-blue-600`} />;
      case "archive":
        return <Archive className={`${iconClass} text-orange-600`} />;
      default:
        return <FileText className={`${iconClass} text-gray-600`} />;
    }
  };

  const renderPreview = () => {
    if (!selectedFile) return null;

    const { type, url, name } = selectedFile;

    switch (type) {
      case "image":
        return (
          <img
            src={url}
            alt={name}
            className="max-w-full max-h-96 object-contain rounded-lg"
          />
        );
      case "video":
        return (
          <video controls className="max-w-full max-h-96 rounded-lg">
            <source src={url} />
            Your browser does not support the video tag.
          </video>
        );
      case "audio":
        return (
          <audio controls className="w-full">
            <source src={url} />
            Your browser does not support the audio tag.
          </audio>
        );
      default:
        return (
          <div className="text-center p-12 text-gray-500">
            <FileText className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Preview not available</p>
            <p className="text-sm mt-2 text-gray-400">
              Use the download button to access the file
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-slate-600 font-medium">
                Loading files...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center justify-center text-red-600 mb-4">
              <AlertCircle className="w-8 h-8 mr-3" />
              <h3 className="text-lg font-semibold">Error Loading Files</h3>
            </div>
            <p className="text-slate-600 text-center mb-6">{error}</p>
            <div className="text-center">
              <button
                onClick={fetchFiles}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                File Manager
              </h1>
              <p className="text-slate-600 text-sm md:text-base">
                Manage your uploaded files with ease
              </p>
            </div>
            <button
              onClick={fetchFiles}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm md:text-base self-start sm:self-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Sync</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
            />
          </div>
        </div>

        {/* Files List Container */}
        <div className="bg-white h-[52vh] rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 md:py-16 px-4">
              <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-base md:text-lg font-medium text-slate-600 mb-2">
                {searchTerm ? "No files found" : "No files uploaded yet"}
              </h3>
              <p className="text-slate-400 text-sm md:text-base">
                {searchTerm
                  ? "Try adjusting your search term"
                  : "Upload some files to get started"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Desktop Table Header - Hidden on Mobile */}
              <div className="hidden md:block bg-slate-50 px-6 py-4 border-b border-slate-200 flex-shrink-0">
                <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-slate-600">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>
              </div>

              {/* Scrollable Files Container */}
              <div
                className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar"
                style={{
                  maxHeight: "calc(100vh - 20vh)",
                  minHeight: "300px",
                }}
              >
                <div className="divide-y divide-slate-100">
                  {filteredFiles.map((file, index) => (
                    <div
                      key={file.name}
                      className={`relative p-4 md:px-6 md:py-4 hover:bg-slate-50 transition-colors duration-150 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-25"
                      }`}
                    >
                      {/* Desktop Layout */}
                      <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                        {/* File Name & Icon */}
                        <div className="col-span-5 flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium text-slate-800 truncate"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">
                              {file.type}
                            </p>
                          </div>
                        </div>

                        {/* File Size */}
                        <div className="col-span-2">
                          <p className="text-sm text-slate-600">{file.size}</p>
                        </div>

                        {/* Created Date */}
                        <div className="col-span-2">
                          <p className="text-sm text-slate-600">
                            {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="col-span-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => viewFile(file)}
                              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                              title="View file"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => copyFileLink(file)}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                copiedFileId === file.id
                                  ? "text-green-600 bg-green-50"
                                  : "text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              }`}
                              title="Copy link"
                            >
                              {copiedFileId === file.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Link className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() => downloadFile(file)}
                              className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                              title="Download file"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => deleteFile(file.name)}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Delete file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="md:hidden">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0 mr-3">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-sm font-medium text-slate-800 truncate"
                                title={file.name}
                              >
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-slate-500 capitalize">
                                  {file.type}
                                </p>
                                <span className="text-xs text-slate-400">•</span>
                                <p className="text-xs text-slate-500">{file.size}</p>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(file.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Mobile Actions Menu */}
                          <div className="relative flex-shrink-0 ml-2">
                            <button
                              onClick={() => 
                                setShowActionsFor(showActionsFor === file.id ? null : file.id)
                              }
                              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {showActionsFor === file.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                                <button
                                  onClick={() => viewFile(file)}
                                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                                <button
                                  onClick={() => copyFileLink(file)}
                                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  {copiedFileId === file.id ? (
                                    <>
                                      <Check className="w-4 h-4 text-green-600" />
                                      <span className="text-green-600">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Link className="w-4 h-4" />
                                      Copy Link
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => downloadFile(file)}
                                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                                <button
                                  onClick={() => deleteFile(file.name)}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showActionsFor && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowActionsFor(null)}
        />
      )}

      {/* Preview Modal */}
      {showPreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 md:p-6 border-b border-slate-200 bg-slate-50 gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-slate-800 truncate">
                  {selectedFile.name}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedFile.size} • {selectedFile.type}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-light w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors flex-shrink-0 self-end sm:self-auto"
              >
                ×
              </button>
            </div>

            <div className="p-4 md:p-6 max-h-96 overflow-auto">{renderPreview()}</div>

            <div className="flex flex-col sm:flex-row gap-3 p-4 md:p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => copyFileLink(selectedFile)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm md:text-base ${
                  copiedFileId === selectedFile.id
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                {copiedFileId === selectedFile.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>

              <button
                onClick={() => downloadFile(selectedFile)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <Download className="w-4 h-4" />
                Download
              </button>

              <button
                onClick={() => deleteFile(selectedFile.name)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesView;