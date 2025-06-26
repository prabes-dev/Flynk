import { useState, useRef, useCallback, useEffect } from "react";
import UploadView from "./UploadView";
import FilesView from "./FilesView";
import Sidebar from "./Sidebar";
import { Menu, CheckCircle, AlertTriangle, X } from "lucide-react";

// Constants
const ROUTES = {
  UPLOAD: "/",
  FILES: "/files"
};

const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error"
};

const DEFAULT_UPLOAD_SETTINGS = {
  isTemporary: true,
  expiresInHours: 24,
};

// Custom Router Hook
const useRouter = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const navigate = useCallback((path) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    }
  }, [currentPath]);

  const replace = useCallback((path) => {
    if (path !== currentPath) {
      window.history.replaceState({}, '', path);
      setCurrentPath(path);
    }
  }, [currentPath]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { currentPath, navigate, replace };
};

const Home = () => {
  const { currentPath, navigate } = useRouter();
  
  // State management
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [uploadSettings, setUploadSettings] = useState(DEFAULT_UPLOAD_SETTINGS);

  const fileInputRef = useRef(null);

  // Get current view from URL
  const getCurrentView = useCallback(() => {
    switch (currentPath) {
      case ROUTES.FILES:
        return 'files';
      case ROUTES.UPLOAD:
      default:
        return 'upload';
    }
  }, [currentPath]);

  // Memoized handlers
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleViewChange = useCallback((view) => {
    // Navigate to the appropriate route
    switch (view) {
      case 'files':
        navigate(ROUTES.FILES);
        break;
      case 'upload':
      default:
        navigate(ROUTES.UPLOAD);
        break;
    }
    
    // Auto-close sidebar on mobile after view change
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [navigate]);

  const handleNotificationClose = useCallback(() => {
    setNotification(null);
  }, []);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
      
      // Optional: Add keyboard shortcuts for navigation
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            handleViewChange('upload');
            break;
          case '2':
            e.preventDefault();
            handleViewChange('files');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, handleViewChange]);

  // Render notification component
  const renderNotification = () => {
    if (!notification) return null;

    const isSuccess = notification.type === NOTIFICATION_TYPES.SUCCESS;
    
    return (
      <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
        <div
          className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 min-w-[300px] ${
            isSuccess
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {isSuccess ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button
            onClick={handleNotificationClose}
            className="p-1 rounded hover:bg-black hover:bg-opacity-20 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Render current view based on route
  const renderCurrentView = () => {
    const currentView = getCurrentView();
    
    switch (currentView) {
      case 'upload':
        return (
          <UploadView 
            setUploadSettings={setUploadSettings}
            uploadSettings={uploadSettings}
            setDragActive={setDragActive}
            dragActive={dragActive}
            setUploadProgress={setUploadProgress}
            uploadProgress={uploadProgress}
            setIsUploading={setIsUploading}
            isUploading={isUploading}
            setUploadedFiles={setUploadedFiles}
            fileInputRef={fileInputRef}
            setNotification={setNotification}
          />
        );
      case 'files':
        return (
          <FilesView 
            uploadedFiles={uploadedFiles}
            setNotification={setNotification}
          />
        );
      default:
        // 404 Page
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Page Not Found</h2>
            <p className="text-gray-500 mb-4">The page you're looking for doesn't exist.</p>
            <button
              onClick={() => handleViewChange('upload')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Go Home
            </button>
          </div>
        );
    }
  };

  // Set initial route if needed
  useEffect(() => {
    // If we're on an unknown route, redirect to home
    const validPaths = Object.values(ROUTES);
    if (!validPaths.includes(currentPath)) {
      navigate(ROUTES.UPLOAD);
    }
  }, [currentPath, navigate]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar
        currentView={getCurrentView()}
        setCurrentView={handleViewChange}
        uploadedFiles={uploadedFiles}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setNotification={setNotification}
      />

      {/* Main Content */}
      <div className="flex-1 transition-all duration-300">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={handleSidebarToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Free Forever</span>
              </div>
              
              {/* Optional: Breadcrumb */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <span>/</span>
                <span className="capitalize">{getCurrentView()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {renderCurrentView()}
        </main>
      </div>

      {/* Notification */}
      {renderNotification()}

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[rgba(0,_0,_0,_0.399)] z-30 lg:hidden transition-opacity duration-300"
          onClick={handleSidebarClose}
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
};

export default Home;