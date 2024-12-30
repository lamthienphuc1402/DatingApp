import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0 -ml-64'} md:w-64 md:ml-0 bg-white shadow-lg transition-all duration-300 fixed md:relative h-full z-30`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-purple-600">Datting App</h1>
        </div>
        <nav className="mt-6">
          <Link
            to="/admin"
            className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-50 hover:text-purple-600"
          >
            <i className="fas fa-chart-line mr-3"></i>
            Dashboard
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-50 hover:text-purple-600"
          >
            <i className="fas fa-users mr-3"></i>
            Quản lý người dùng
          </Link>
          <Link
            to="/admin/management"
            className="flex items-center px-6 py-3 text-gray-600 hover:bg-purple-50 hover:text-purple-600"
          >
            <i className="fas fa-user-shield mr-3"></i>
            Quản lý QTV
          </Link>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 md:px-8">
            {/* Hamburger menu for mobile */}
            <button 
              className="p-2 md:hidden text-gray-600 hover:text-purple-600"
              onClick={toggleSidebar}
            >
              <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout; 