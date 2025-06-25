import { useState, useEffect } from "react";
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
  const [files, setFiles] = useState([
    {
      name: "Block.io_demo_file.zip",
      size: "33.38 MB",
      created_at: "2025-06-24T10:30:00Z",
      type: "archive",
      id: "1",
      url: "#"
    },
    {
      name: "presentation.pdf",
      size: "2.4 MB", 
      created_at: "2025-06-23T14:15:00Z",
      type: "document",
      id: "2",
      url: "#"
    },
    {
      name: "vacation_photo.jpg",
      size: "5.2 MB",
      created_at: "2025-06-22T09:45:00Z", 
      type: "image",
      id: "3",
      url: "#"
    }
  ]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedFileId, setCopiedFileId] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    setFilteredFiles(files);
  }, [files]);

  useEffect(() => {
    const filtered = files.filter((file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFiles(filtered);
  }, [files, searchTerm]);

  const fetchFiles = async () => {
    // Simulate refresh
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const deleteFile = async (fileName) => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      return;
    }
    setFiles(files.filter((file) => file.name !== fileName));
    if (selectedFile?.name === fileName) {
      setShowPreview(false);
      setSelectedFile(null);
    }
  };

  const viewFile = (file) => {
    setSelectedFile(file);
    setShowPreview(true);
    setOpenDropdown(null);
  };

  const downloadFile = async (file) => {
    alert(`Downloading ${file.name}...`);
    setOpenDropdown(null);
  };

  const copyFileLink = async (file) => {
    try {
      await navigator.clipboard.writeText(file.url);
      setCopiedFileId(file.id);
      setTimeout(() => setCopiedFileId(null), 2000);
      setOpenDropdown(null);
    } catch (error) {
      alert("Failed to copy link to clipboard");
      console.error("Copy link error:", error);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
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
      <div className="max-w-6xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">
                File Manager
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Manage your uploaded files with ease
              </p>
            </div>
            <button
              onClick={fetchFiles}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Sync</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Files List Container */}
        <div className="bg-white h-[52vh] rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                {searchTerm ? "No files found" : "No files uploaded yet"}
              </h3>
              <p className="text-slate-400">
                {searchTerm
                  ? "Try adjusting your search term"
                  : "Upload some files to get started"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Desktop Table Header - Hidden on mobile */}
              <div className="hidden md:block bg-slate-50 px-6 py-4 border-b border-slate-200 flex-shrink-0">
                <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-slate-600">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>
              </div>

              {/* Mobile Header */}
              <div className="md:hidden bg-slate-50 px-4 py-3 border-b border-slate-200 flex-shrink-0">
                <div className="text-sm font-medium text-slate-600">Files</div>
              </div>

              {/* Scrollable Files Container */}
              <div
                className="flex-1 overflow-y-auto scroll-smooth"
                style={{
                  maxHeight: "calc(100vh - 20vh)",
                  minHeight: "300px",
                }}
              >
                <div className="divide-y divide-slate-100">
                  {filteredFiles.map((file, index) => (
                    <div
                      key={file.name}
                      className={`px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors duration-150 ${
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
                        <div className="flex items-center justify-between">
                          {/* File Info */}
                          <div className="flex items-center flex-1 min-w-0 mr-3">
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
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <span className="capitalize">{file.type}</span>
                                <span>•</span>
                                <span>{file.size}</span>
                                <span>•</span>
                                <span>{new Date(file.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}</span>
                              </div>
                            </div>
                          </div>

                          {/* Mobile Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => viewFile(file)}
                              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                              title="View file"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Mobile Dropdown Menu */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenDropdown(openDropdown === file.id ? null : file.id)}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                title="More actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openDropdown === file.id && (
                                <>
                                  {/* Backdrop */}
                                  <div 
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenDropdown(null)}
                                  />
                                  
                                  {/* Dropdown Menu */}
                                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                                    <button
                                      onClick={() => copyFileLink(file)}
                                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                                        copiedFileId === file.id
                                          ? "text-green-600"
                                          : "text-slate-700"
                                      }`}
                                    >
                                      {copiedFileId === file.id ? (
                                        <Check className="w-4 h-4" />
                                      ) : (
                                        <Link className="w-4 h-4" />
                                      )}
                                      {copiedFileId === file.id ? "Copied!" : "Copy Link"}
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
                                </>
                              )}
                            </div>
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

      {/* Preview Modal */}
      {showPreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl w-full">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
              <div className="min-w-0 flex-1 mr-4">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800 truncate">
                  {selectedFile.name}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedFile.size} • {selectedFile.type}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-light w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors flex-shrink-0"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 max-h-96 overflow-auto">{renderPreview()}</div>

            <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => copyFileLink(selectedFile)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 ${
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
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>

              <button
                onClick={() => deleteFile(selectedFile.name)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
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