import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";

interface ProfilePhotoViewerProps {
  src: string;
  name: string;
  className: string;
}

export function ProfilePhotoViewer({ src, name, className }: ProfilePhotoViewerProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Modal
      title="Profile photo"
      description={name}
      onOpenChange={() => setImageError(false)}
      className="w-[calc(100%-2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto rounded-lg p-4 sm:p-6"
      trigger={
        <Button
          type="button"
          variant="ghost"
          aria-label={`View ${name}'s profile photo`}
          title="View profile photo"
          className={`${className} shrink-0 overflow-hidden p-0 hover:bg-transparent`}
        >
          <img src={src} alt={`${name}'s profile photo`} className="h-full w-full object-cover" />
        </Button>
      }
    >
      {imageError ? (
        <p role="alert" className="py-8 text-center text-sm text-muted-foreground">
          This photo couldn't be loaded. Please close this window and try again.
        </p>
      ) : (
        <img
          src={src}
          alt={`${name}'s profile photo enlarged`}
          className="max-h-[70dvh] w-full rounded-lg object-contain"
          onError={() => setImageError(true)}
        />
      )}
    </Modal>
  );
}