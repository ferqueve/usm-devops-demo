import { GalleryVerticalEnd } from "lucide-react";

// Componente para el header con logo
export function AuthHeader() {
  return (
    <div className="flex justify-center gap-2 md:justify-start">
      <a href="#" className="flex items-center gap-2 font-medium">
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-4" />
        </div>
        <span className="font-utec-brand">USM</span>
      </a>
    </div>
  );
}
