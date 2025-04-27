"use client";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6 ", className)}
    >
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
};

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-6 h-6 ", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export type LoadingState = {
  text: string;
};

const LoaderCore = ({
  loadingStates,
  value = 0,
}: {
  loadingStates: LoadingState[];
  value?: number;
}) => {
  return (
    <div className="flex relative justify-start max-w-xl mx-auto flex-col mt-40">
      {loadingStates.map((loadingState, index) => {
        const distance = Math.abs(index - value);
        const opacity = Math.max(1 - distance * 0.2, 0);

        return (
          <div
            key={index}
            className={cn(
              "text-left flex gap-2 mb-4 transition-all duration-500",
              "opacity-0"
            )}
            style={{
              opacity: opacity,
              transform: `translateY(${-(value * 40)}px)`,
              animation: "fadeSlideIn 0.5s forwards"
            }}
          >
            <div>
              {index > value && (
                <CheckIcon className="text-black dark:text-white" />
              )}
              {index <= value && (
                <CheckFilled
                  className={cn(
                    "text-black dark:text-white",
                    value === index &&
                      "text-black dark:text-lime-500 opacity-100"
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "text-black dark:text-white",
                value === index && "text-black dark:text-lime-500 opacity-100"
              )}
            >
              {loadingState.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const SimpleMultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
  loop = false,
  onComplete,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
  onComplete?: () => void;
}) => {
  const [currentState, setCurrentState] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      setVisible(false);
      return;
    }
    
    setVisible(true);
    
    const timeout = setTimeout(() => {
      if (currentState < loadingStates.length - 1) {
        setCurrentState(currentState + 1);
      } else {
        if (loop) {
          setCurrentState(0);
        } else if (onComplete) {
          setTimeout(() => {
            setVisible(false);
            onComplete();
          }, 1000);
        }
      }
    }, duration);

    return () => clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration, onComplete]);
  
  if (!visible) return null;
  
  return (
    <div className="w-full h-full fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl bg-black/20 dark:bg-black/40 transition-opacity duration-300">
      <div className="h-96 relative">
        <LoaderCore value={currentState} loadingStates={loadingStates} />
      </div>

      <div className="bg-gradient-to-t inset-x-0 z-20 bottom-0 bg-white dark:bg-black h-full absolute opacity-60" />
    </div>
  );
};
