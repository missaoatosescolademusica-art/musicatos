"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, ChevronDown } from "lucide-react"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function MultiSelect({ options, selected, onChange }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const removeOption = (option: string) => {
    onChange(selected.filter((item) => item !== option))
  }

  return (
    <div ref={ref} className="relative mt-2 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
      >
        <span className="truncate">
          {selected.length === 0
            ? "Selecione instrumentos"
            : `${selected.length} selecionado${selected.length !== 1 ? "s" : ""}`}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg">
          <div className="p-2">
            {options.map((option) => (
              <label key={option} className="flex items-center p-2 hover:bg-slate-600 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="w-4 h-4 rounded border-slate-500 bg-slate-600"
                />
                <span className="ml-2 text-slate-200">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Display selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((option) => (
            <Badge key={option} variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700">
              {option}
              <button type="button" onClick={() => removeOption(option)} className="ml-1 hover:text-blue-200">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
