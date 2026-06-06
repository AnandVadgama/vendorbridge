import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import styles from './Input.module.css';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  type?: string;
  // If type="textarea", we use these textarea props
  textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const Input = forwardRef<HTMLInputElement & HTMLTextAreaElement, InputProps>(
  ({ label, error, helperText, fullWidth = true, type = 'text', className, textareaProps, onChange, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const isTextarea = type === 'textarea';

    return (
      <div className={cn(styles.wrapper, fullWidth && styles.fullWidth, className)}>
        {label ? (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        ) : null}
        
        <div className={styles.inputContainer}>
          {isTextarea ? (
            <textarea
              id={inputId}
              ref={ref as any}
              className={cn(
                styles.textarea,
                error && styles.inputError
              )}
              onChange={onChange as any}
              {...(textareaProps as any)}
              {...(props as any)}
            />
          ) : (
            <input
              id={inputId}
              type={type}
              ref={ref as any}
              className={cn(
                styles.input,
                error && styles.inputError
              )}
              onChange={onChange}
              {...props}
            />
          )}
        </div>

        {error ? (
          <span className={styles.errorText}>{error}</span>
        ) : helperText ? (
          <span className={styles.helperText}>{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
