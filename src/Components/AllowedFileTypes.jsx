const AllowedFileTypes = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/x-icon",
  "image/heic",

  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/rtf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml",

  // Compressed Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/gzip",
  "application/x-tar",
  "application/x-bzip",
  "application/x-bzip2",
  "application/octet-stream", // fallback for unknown types

  // Audio
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/aac",
  "audio/x-flac",

  // Video
  "video/mp4",
  "video/webm",
  "video/x-msvideo", // avi
  "video/x-matroska", // mkv
  "video/ogg",
  "video/quicktime", // mov

  // Code Files
  "text/javascript",
  "application/javascript",
  "text/html",
  "text/css",
  "text/x-python",
  "text/x-c",
  "text/x-c++",
  "application/x-httpd-php",
  "text/x-java-source",
  "text/x-shellscript",

  // Fonts
  "font/ttf",
  "font/woff",
  "font/woff2",
  "application/vnd.ms-fontobject",
  "font/otf",
];

export default AllowedFileTypes;
