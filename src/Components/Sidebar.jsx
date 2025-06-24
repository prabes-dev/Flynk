import { X, Upload, FileText, Settings, LogIn } from "lucide-react";
import logo from "../assets/logo.png"; 

const Sidebar = ({
  currentView,
  setCurrentView,
  uploadedFiles,
  sidebarOpen,
  setSidebarOpen,
}) => {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 h-screen w-64 bg-white shadow-lg transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <img src={logo} alt="Flynk Logo" className="h-10 w-auto max-w-[150px] ml-4" />
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="p-4 space-y-2">
        <button
          onClick={() => setCurrentView("upload")}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === "upload"
              ? "bg-blue-50 text-blue-600"
              : "hover:bg-gray-100"
          }`}
        >
          <Upload className="w-5 h-5" />
          <span>Upload Files</span>
        </button>

        <button
          onClick={() => setCurrentView("files")}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === "files"
              ? "bg-blue-50 text-blue-600"
              : "hover:bg-gray-100"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Files</span>
          {uploadedFiles.length > 0 && (
            <span className="ml-auto bg-blue-100 text-blue-600 text-xs rounded-full px-2 py-1">
              {uploadedFiles.length}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
