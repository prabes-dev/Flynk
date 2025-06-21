import { useState, useRef } from "react";
import UploadView from "./UploadView";
import FilesView from "./FilesView";
import Sidebar from "./Sidebar";
import { Menu, Shield, CheckCircle, AlertTriangle } from "lucide-react";

const Home = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentView, setCurrentView] = useState("upload");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const fileInputRef = useRef(null);
  return (
    <div className="flex min-h-screen bg-gray-50 ">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        uploadedFiles={uploadedFiles}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setNotification={setNotification}
      />

      {/* Main Content */}
      <div className=" flex-1 transition-all duration-300">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Encrypted & Secure</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Free Forever</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {currentView === "upload" && <UploadView 
            setDragActive={setDragActive}
            dragActive={dragActive}
            setUploadProgress={setUploadProgress}
            uploadProgress={uploadProgress}
            setIsUploading={setIsUploading}
            isUploading={isUploading}
            setUploadedFiles={setUploadedFiles}
            fileInputRef={fileInputRef}
            setNotification={setNotification}
          />}
          {currentView === "files" && <FilesView/>}
          {currentView === "settings" && <SettingsView/>}
        </main>
      </div>
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[rgba(0,_0,_0,_0.411)] z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Home;
