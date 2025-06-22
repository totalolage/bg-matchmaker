import type { ComponentProps } from "react"
import { FormProvider } from "react-hook-form"

export const Form = FormProvider

export type FormProps = ComponentProps<typeof Form>