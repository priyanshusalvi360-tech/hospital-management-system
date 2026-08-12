import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
            <ShieldAlert size={64} />
          </div>
        </div>
        <h1 className="text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600 mb-4">401</h1>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-lg">
          You do not have permission to view this page. If you believe this is a mistake, please contact your administrator.
        </p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:-translate-y-0.5"
          >
            Go Back
          </button>
          <Link 
            to="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            Return to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;