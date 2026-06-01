"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("m-1 p-4 bg-white dark:bg-zinc-950 border-4 border-primary/40 dark:border-zinc-800  shadow-xl", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-bold tracking-wide capitalize text-foreground",
        nav: "space-x-1 flex items-center",
        button_previous: "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center hover:cursor-pointer z-10",
        button_next: "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center hover:cursor-pointer z-10",
        month_grid: "w-full border-collapse select-none",
        weekdays: "flex",
        weekday: "text-muted-foreground w-9 h-9 flex items-center justify-center font-black text-[0.7rem] uppercase tracking-tighter p-0 m-0",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm p-0 flex items-center justify-center relative [&:has([aria-selected])]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full m-0",
        day_button: cn(
          "h-9 w-9 p-0 font-medium rounded-full hover:bg-slate-300 dark:hover:bg-zinc-800 hover:text-foreground transition-all flex items-center justify-center m-0 hover:cursor-pointer border-0 bg-transparent",
          "aria-selected:bg-secondary aria-selected:text-white aria-selected:font-black aria-selected:opacity-100"
        ),
        today: "border-2 border-secondary text-secondary font-black",
        outside: "text-muted-foreground opacity-30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-30",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4" {...props} />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
