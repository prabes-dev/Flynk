import { X, Upload, FileText, Settings, LogIn } from "lucide-react";

const Sidebar = ({ currentView, setCurrentView, uploadedFiles, isAuthenticated, setIsAuthenticated, sidebarOpen, setSidebarOpen }) => {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 h-screen w-64 bg-white shadow-lg transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Flynk
        </h1>
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

        <button
          onClick={() => setCurrentView("settings")}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            currentView === "settings"
              ? "bg-blue-50 text-blue-600"
              : "hover:bg-gray-100"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        {!isAuthenticated ? (
          <button
            onClick={() => setIsAuthenticated(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <LogIn className="w-5 h-5" />
            <span>Sign In</span>
          </button>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-gray-500">Premium User</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
