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
      <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${color}`}>
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