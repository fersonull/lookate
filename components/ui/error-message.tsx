// Reusable Error Message Component
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800 ${className}`}>
      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  );
}

interface FieldErrorProps {
  error?: string;
  className?: string;
}

export function FieldError({ error, className = "" }: FieldErrorProps) {
  if (!error) return null;

  return (
    <p className={`text-sm text-red-600 dark:text-red-400 mt-1 ${className}`}>
      {error}
    </p>
  );
}