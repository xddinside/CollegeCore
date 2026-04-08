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
    y: 20,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOutExpo,
    },
  },
};

export function AnimatedHomeContent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex w-full max-w-2xl flex-col items-start"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Brand label - subtle, above */}
      <motion.div variants={itemVariants} className="mb-6">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          CollegeCore
        </span>
      </motion.div>

      {/* Main headline - single fluid line */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-balance text-[clamp(2.5rem,8vw,4.5rem)] font-semibold leading-[1.1] tracking-tight text-foreground">
          Semester planning,{' '}
          <span className="text-muted-foreground">simplified.</span>
        </h1>
      </motion.div>

      {/* Description - tighter to headline */}
      <motion.p 
        variants={itemVariants}
        className="mb-10 max-w-md text-base leading-relaxed text-muted-foreground"
      >
        Track assignments, study sprints, and subjects in one calm workspace designed for focus.
      </motion.p>

      {/* Actions - horizontal, grounded */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-row items-center gap-3"
      >
        <motion.div
          whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.15, ease: easeOutExpo }}
        >
          <Link href="/sign-up">
            <Button size="default" className="px-5 text-sm">
              Get started
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
        
        <motion.div
          whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          transition={{ duration: 0.15, ease: easeOutExpo }}
        >
          <Link href="/sign-in">
            <Button variant="ghost" size="default" className="px-5 text-sm">
              Sign in
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
