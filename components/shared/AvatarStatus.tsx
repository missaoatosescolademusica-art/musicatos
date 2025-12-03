"use client"
import * as Tooltip from "@radix-ui/react-tooltip"
import React from "react"

export type UserPresence = "online" | "away" | "offline"

export function statusLabel(s: UserPresence | null | undefined) {
  return s === "online" ? "Online" : s === "away" ? "Ausente" : "Offline"
}

export default function AvatarStatus({
  status,
  sizePx = 12,
  borderPx = 2,
  children,
}: {
  status: UserPresence | null | undefined
  sizePx?: number
  borderPx?: number
  children: React.ReactNode
}) {
  const color = status === "online" ? "#4CAF50" : status === "away" ? "#FFEB3B" : "#9CA3AF"
  const visible = true
  return (
    <div className="relative inline-block">
      {children}
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span
              aria-label={statusLabel(status)}
              style={{
                width: sizePx,
                height: sizePx,
                borderWidth: borderPx,
                borderColor: "#FFFFFF",
                backgroundColor: color,
              }}
              className={`absolute top-0 right-0 rounded-full transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
            />
          </Tooltip.Trigger>
          <Tooltip.Content className="bg-slate-900 text-white text-xs px-2 py-1 rounded border border-slate-700">
            {statusLabel(status)}
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  )
}
