import { toast } from "@/hooks/useToast"

export const showSuccess = (title: string, description?: string) => {
  toast({
    variant: "success",
    title,
    description,
  })
}

export const showError = (title: string, description?: string) => {
  toast({
    variant: "destructive",
    title,
    description,
  })
}

export const showWarning = (title: string, description?: string) => {
  toast({
    variant: "warning",
    title,
    description,
  })
}

export const showInfo = (title: string, description?: string) => {
  toast({
    variant: "default",
    title,
    description,
  })
}

// Utility functions for common scenarios
export const showSuccessMessage = (message: string) => {
  showSuccess("¡Éxito!", message)
}

export const showErrorMessage = (message: string) => {
  showError("Error", message)
}

export const showWarningMessage = (message: string) => {
  showWarning("Advertencia", message)
}

export const showInfoMessage = (message: string) => {
  showInfo("Información", message)
}