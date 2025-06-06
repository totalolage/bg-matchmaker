import { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const timeSlotButtonVariants = cva(
  "col-span-3 h-10 text-xs font-medium transition-all relative overflow-hidden",
  {
    variants: {
      state: {
        default: "bg-white hover:bg-gray-50 border-gray-200",
        selected: "bg-purple-200 text-purple-900 border-purple-400 hover:bg-purple-300",
        confirmed: "bg-purple-500 text-white border-purple-600 hover:bg-purple-600",
        disabled: "bg-gray-50 text-gray-400 cursor-not-allowed hover:bg-gray-50",
        hoverRange: "bg-purple-200 text-purple-900 border-purple-400",
        hoverDelete: [
          "bg-purple-500 text-white border-purple-600 hover:bg-purple-500 hover:text-white",
          "[background-image:repeating-linear-gradient(-45deg,transparent,transparent_3px,rgba(255,255,255,0.3)_3px,rgba(255,255,255,0.3)_6px)]",
        ],
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

export interface TimeSlotButtonProps
  extends ComponentProps<typeof Button>,
    VariantProps<typeof timeSlotButtonVariants> {
  time: string;
  state?: "default" | "selected" | "confirmed" | "disabled" | "hoverRange" | "hoverDelete";
}

export const TimeSlotButton = ({
  time,
  state = "default",
  className,
  disabled,
  ...props
}: TimeSlotButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(timeSlotButtonVariants({ state }), className)}
      disabled={disabled || state === "disabled"}
      aria-label={`Select ${time} time slot`}
      aria-pressed={state === "selected" || state === "confirmed"}
      {...props}
    >
      {time}
    </Button>
  );
};
