/// components\organisms\Loading.tsx

"use client";

import { LoaderCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/hooks/useLoading";

export default function Loading() {
  const { isLoading } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.3)] flex items-center justify-center flex-col backdrop-blur-sm"
        >
          <LoaderCircle className="animate-spin h-16 w-16 text-white" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
