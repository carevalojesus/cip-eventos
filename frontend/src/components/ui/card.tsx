import * as React from "react"

import { cn } from "@/lib/utils"

type CardPaddingVariant = 'compact' | 'standard' | 'spacious'

interface CardProps extends React.ComponentProps<"div"> {
  padding?: CardPaddingVariant
}

const paddingVariantsY: Record<CardPaddingVariant, string> = {
  compact: 'py-4',    // 16px
  standard: 'py-5',   // 20px
  spacious: 'py-6',   // 24px
}

const paddingVariantsX: Record<CardPaddingVariant, string> = {
  compact: 'px-4',    // 16px
  standard: 'px-5',   // 20px
  spacious: 'px-6',   // 24px
}

const CardPaddingContext = React.createContext<CardPaddingVariant>('standard')

function Card({ className, padding = 'standard', ...props }: CardProps) {
  return (
    <CardPaddingContext.Provider value={padding}>
      <div
        data-slot="card"
        className={cn(
          "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm",
          paddingVariantsY[padding],
          className
        )}
        {...props}
      />
    </CardPaddingContext.Provider>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  const padding = React.useContext(CardPaddingContext)
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        paddingVariantsX[padding],
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  const padding = React.useContext(CardPaddingContext)
  return (
    <div
      data-slot="card-content"
      className={cn(paddingVariantsX[padding], className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  const padding = React.useContext(CardPaddingContext)
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center [.border-t]:pt-6", paddingVariantsX[padding], className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
