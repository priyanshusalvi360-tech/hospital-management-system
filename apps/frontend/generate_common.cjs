const fs = require('fs');
const path = require('path');
const p = (p) => path.join('C:/Users/Priyanshu/.gemini/antigravity/scratch/hms/apps/frontend', p);

function write(f, c) {
  fs.mkdirSync(path.dirname(p(f)), { recursive: true });
  fs.writeFileSync(p(f), c.trim());
}

write('src/components/common/StatCard.tsx', `
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: string;
}

export function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass p-6 rounded-xl flex items-center gap-4"
    >
      <div className={\`w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 \${color}\`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
        {trend && <p className="text-xs text-green-500 mt-1">{trend}</p>}
      </div>
    </motion.div>
  );
}
`);

write('src/components/common/SearchBar.tsx', `
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-10 py-2 bg-gray-100 dark:bg-gray-800 border-transparent rounded-lg focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
`);

write('src/components/common/ConfirmDialog.tsx', `
export function ConfirmDialog() {
  return null;
}
`);

write('src/components/common/EmptyState.tsx', `
import { motion } from 'framer-motion';

export function EmptyState({ title, description, icon: Icon }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 text-center">
      <Icon className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </motion.div>
  );
}
`);

write('src/components/common/LoadingSkeleton.tsx', `
export function LoadingSkeleton() {
  return <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-20 rounded-xl w-full"></div>;
}
`);
