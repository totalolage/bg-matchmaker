import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import * as React from "react"
import type { ComponentProps } from "react"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
} from "react-hook-form"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { useFormField } from "./hooks"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

export const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}


type FormItemContextValue = {
  id: string
}

export const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = (props: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => {
  const { className, ref, ...rest } = props
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...rest} />
    </FormItemContext.Provider>
  )
}
export type FormItemProps = ComponentProps<typeof FormItem>

const FormLabel = (props: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { ref?: React.Ref<React.ElementRef<typeof LabelPrimitive.Root>> }) => {
  const { className, ref, ...rest } = props
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...rest}
    />
  )
}
export type FormLabelProps = ComponentProps<typeof FormLabel>

const FormControl = (props: React.ComponentPropsWithoutRef<typeof Slot> & { ref?: React.Ref<React.ElementRef<typeof Slot>> }) => {
  const { ref, ...rest } = props
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...rest}
    />
  )
}
export type FormControlProps = ComponentProps<typeof FormControl>

const FormDescription = (props: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) => {
  const { className, ref, ...rest } = props
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...rest}
    />
  )
}
export type FormDescriptionProps = ComponentProps<typeof FormDescription>

const FormMessage = (props: React.HTMLAttributes<HTMLParagraphElement> & { ref?: React.Ref<HTMLParagraphElement> }) => {
  const { className, children, ref, ...rest } = props
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...rest}
    >
      {body}
    </p>
  )
}
export type FormMessageProps = ComponentProps<typeof FormMessage>

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
}

export type FormProps = ComponentProps<typeof Form>
export type FormFieldProps = ComponentProps<typeof FormField>