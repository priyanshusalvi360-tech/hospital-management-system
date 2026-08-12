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