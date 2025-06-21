import { useState, useEffect } from 'react';
import { supabase } from './SupaBase'; 
import { Trash2, Eye, Download, FileText, Image, Film, Music, Archive } from 'lucide-react';

const FilesView = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Define your Supabase bucket name
  const BUCKET_NAME = 'uploads';

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
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
            type: getFileType(file.name)
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
      setFiles(files.filter(file => file.name !== fileName));
      
      // Close preview if deleted file was being previewed
      if (selectedFile?.name === fileName) {
        setShowPreview(false);
        setSelectedFile(null);
      }
    } catch (err) {
      alert(`Error deleting file: ${err.message}`);
    }
  };

  const viewFile = (file) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  const downloadFile = async (file) => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(file.name);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error downloading file: ${err.message}`);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const audioTypes = ['mp3', 'wav', 'ogg', 'aac', 'flac'];
    const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];

    if (imageTypes.includes(extension)) return 'image';
    if (videoTypes.includes(extension)) return 'video';
    if (audioTypes.includes(extension)) return 'audio';
    if (archiveTypes.includes(extension)) return 'archive';
    return 'document';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Film className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'archive': return <Archive className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const renderPreview = () => {
    if (!selectedFile) return null;

    const { type, url, name } = selectedFile;

    switch (type) {
      case 'image':
        return <img src={url} alt={name} className="max-w-full max-h-96 object-contain" />;
      case 'video':
        return (
          <video controls className="max-w-full max-h-96">
            <source src={url} />
            Your browser does not support the video tag.
          </video>
        );
      case 'audio':
        return (
          <audio controls className="w-full">
            <source src={url} />
            Your browser does not support the audio tag.
          </audio>
        );
      default:
        return (
          <div className="text-center p-8 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4" />
            <p>Preview not available for this file type</p>
            <p className="text-sm mt-2">Use the download button to access the file</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Error loading files: {error}</p>
        <button 
          onClick={fetchFiles}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Files ({files.length})</h1>
        <button 
          onClick={fetchFiles}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <p>No files found in the bucket</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <div key={file.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                {getFileIcon(file.type)}
                <h3 className="ml-2 font-medium text-gray-800 truncate flex-1" title={file.name}>
                  {file.name}
                </h3>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>Size: {file.size}</p>
                <p>Created: {new Date(file.created_at).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => viewFile(file)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => downloadFile(file)}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => deleteFile(file.name)}
                  className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-medium truncate">{selectedFile.name}</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {renderPreview()}
            </div>
            <div className="flex gap-2 p-4 border-t">
              <button
                onClick={() => downloadFile(selectedFile)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => {
                  deleteFile(selectedFile.name);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center gap-2"
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