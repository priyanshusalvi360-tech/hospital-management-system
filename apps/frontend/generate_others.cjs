const fs = require('fs');
const path = require('path');
const p = (p) => path.join('C:/Users/Priyanshu/.gemini/antigravity/scratch/hms/apps/frontend', p);

function write(f, c) {
  fs.mkdirSync(path.dirname(p(f)), { recursive: true });
  fs.writeFileSync(p(f), c.trim());
}

const pageTemplate = (title) => `
export default function ${title.replace(/\s+/g, '')}Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">${title}</h1>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center text-gray-500 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No data available yet</p>
        <p className="text-sm">The ${title.toLowerCase()} list is currently empty.</p>
      </div>
    </div>
  );
}
`;

write('src/pages/patients/PatientsPage.tsx', pageTemplate('Patients'));
write('src/pages/patients/PatientDetailPage.tsx', pageTemplate('Patient Detail'));
write('src/pages/staff/StaffPage.tsx', pageTemplate('Staff'));
write('src/pages/reports/ReportsPage.tsx', pageTemplate('Reports'));
write('src/pages/admissions/AdmissionsPage.tsx', pageTemplate('Admissions'));
write('src/pages/discharge/DischargePage.tsx', pageTemplate('Discharge'));
write('src/pages/profile/ProfilePage.tsx', pageTemplate('Profile'));
write('src/pages/settings/SettingsPage.tsx', pageTemplate('Settings'));

write('src/pages/errors/NotFoundPage.tsx', `
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <h1 className="text-9xl font-black text-gray-200 dark:text-gray-800 tracking-tight">404</h1>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
           {/* Add a medical cross or something cool */}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Page not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          <Home className="w-5 h-5" />
          Return to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
`);

write('src/pages/errors/UnauthorizedPage.tsx', `
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800"
      >
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          You do not have permission to view this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
`);
