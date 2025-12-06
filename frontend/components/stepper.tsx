import * as React from "react"
import { cn } from "@/lib/utils"

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStep: number
  children: React.ReactNode
}

interface StepProps {
  index: number
  children: React.ReactNode
}

interface StepItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface StepSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

// Context so child Steps can access the current step without prop-drilling
const StepperContext = React.createContext<number | undefined>(undefined)

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, currentStep, children, ...props }, ref) => {
    return (
      <StepperContext.Provider value={currentStep}>
        <div
          ref={ref}
          className={cn(
            "flex w-full items-center justify-between",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = "Stepper"

const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ index, children, ...props }, ref) => {
    // read currentStep from context; default to 0 if not provided
    const currentStep = React.useContext(StepperContext) ?? 0

    const isCompleted = index < currentStep
    const isCurrent = index === currentStep

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          isCompleted && "text-primary",
          isCurrent && "text-primary font-medium",
          !isCompleted && !isCurrent && "text-muted-foreground"
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Step.displayName = "Step"

const StepItem = React.forwardRef<HTMLDivElement, StepItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
StepItem.displayName = "StepItem"

const StepSeparator = React.forwardRef<HTMLDivElement, StepSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-4 h-0.5 flex-1 bg-border min-w-[40px]",
          className
        )}
        {...props}
      />
    )
  }
)
StepSeparator.displayName = "StepSeparator"

export { Stepper, Step, StepItem, StepSeparator }