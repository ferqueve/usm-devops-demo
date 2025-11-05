import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

const Toaster = ({ ...props }: ToasterProps) => {
  const [mounted, setMounted] = useState(false)
  const { theme = "system" } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Evitar hidratación incorrecta
  if (!mounted) {
    return null
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      expand={true}
      richColors={true}
      duration={5000}
      closeButton={true}
      toastOptions={{
        duration: 5000,
        style: {
          background: 'var(--popover)',
          color: 'var(--popover-foreground)',
          border: '1px solid var(--border)',
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

