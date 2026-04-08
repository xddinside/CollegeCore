'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/app/ui/1/components/button';

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.7,
      ease: easeOutExpo,
    },
  },
};

export function AnimatedHomeContent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex w-full flex-col items-start"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Brand name - now larger and more prominent */}
      <motion.div variants={itemVariants} className="mb-8">
        <span className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
          CollegeCore
        </span>
      </motion.div>

      {/* Main headline */}
      <motion.div variants={itemVariants} className="mb-12">
        <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
          Semester
          <br />
          planning,
          <br />
          <span className="text-muted-foreground">simplified.</span>
        </h1>
      </motion.div>

      {/* Description */}
      <motion.p 
        variants={itemVariants}
        className="mb-14 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl"
      >
        Track assignments, study sprints, and subjects in one calm workspace designed for focus.
      </motion.p>

      {/* Actions */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center"
      >
        <motion.div
          whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.15, ease: easeOutExpo }}
        >
          <Link href="/sign-up">
            <Button size="lg" className="h-14 px-8 text-base">
              Get started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
        
        <motion.div
          whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.15, ease: easeOutExpo }}
        >
          <Link href="/sign-in">
            <Button variant="ghost" size="lg" className="h-14 px-8 text-base">
              Sign in
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
