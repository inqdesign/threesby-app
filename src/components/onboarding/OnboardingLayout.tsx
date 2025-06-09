import React from 'react';
import { motion } from 'framer-motion';
import { OnboardingStep } from '../../types/index';

type OnboardingLayoutProps = {
  children: React.ReactNode;
  currentStep: OnboardingStep;
  totalSteps: number;
  currentStepNumber: number;
};

export function OnboardingLayout({
  children,
  currentStep: _currentStep,
  totalSteps,
  currentStepNumber
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4F4F4] py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Step {currentStepNumber} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStepNumber / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#252525]"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-8"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}