"use client"

import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface SafeNumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number
  onChange: (value: number) => void
  onStringChange?: (value: string) => void
}

/**
 * A wrapper around Input that manages a local string state to allow 
 * typing decimals (like "10.") without instant state-driven normalization 
 * that causes character loss or cursor jumps.
 */
export function SafeNumericInput({
  value,
  onChange,
  onStringChange,
  className,
  inputMode = "decimal",
  ...props
}: SafeNumericInputProps) {
  // Local string state to handle intermediate typing (e.g., "10.")
  const [localValue, setLocalValue] = React.useState<string>(
    value === 0 && props.placeholder ? "" : String(value)
  )

  // Sync from outside if value changes externally and is different from our parsed localValue
  React.useEffect(() => {
    if (parseFloat(localValue) !== value) {
        setLocalValue(value === 0 ? "" : String(value))
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(',', '.') // Normalize comma to dot
    
    // Only allow valid numeric patterns or empty/dot
    if (raw === "" || raw === "." || /^-?\d*\.?\d*$/.test(raw)) {
      setLocalValue(raw)
      onStringChange?.(raw)
      
      const parsed = parseFloat(raw)
      if (!isNaN(parsed)) {
        onChange(parsed)
      } else {
        onChange(0)
      }
    }
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode={inputMode}
      value={localValue}
      onChange={handleChange}
      className={cn("font-mono", className)}
    />
  )
}
