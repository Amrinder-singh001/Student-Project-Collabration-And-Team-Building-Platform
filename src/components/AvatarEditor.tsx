import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cropAvatar } from "@/lib/crop-avatar";

interface AvatarEditorProps {
  file: File;
  onCancel: () => void;
  onSave: (file: File) => Promise<boolean>;
}

export function AvatarEditor({ file, onCancel, onSave }: AvatarEditorProps) {
  const [source, setSource] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function save() {
    if (!area || saving) return;
    setSaving(true);
    try {
      const photo = await cropAvatar(source, area);
      if (await onSave(photo)) onCancel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save your photo. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onOpenChange={(open) => { if (!open && !saving) onCancel(); }}
      title="Adjust profile photo"
      description="Photo preview"
      className="w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-lg p-4 sm:p-6"
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
          <Button disabled={saving || !area || imageError} onClick={() => void save()}>
            {saving ? "Saving…" : "Save photo"}
          </Button>
        </div>
      }
    >
      <div className="avatar-crop relative aspect-square max-h-[min(48dvh,360px)] w-full overflow-hidden rounded-lg bg-muted">
        {source && !imageError ? (
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
            onMediaLoaded={() => setImageError(false)}
            mediaProps={{ onError: () => { setImageError(true); setArea(null); } }}
            style={{ containerStyle: { background: "var(--muted)" } }}
          />
        ) : imageError ? (
          <p role="alert" className="p-6 text-sm text-destructive">This image cannot be opened. Please choose a JPG, PNG or WebP photo.</p>
        ) : null}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="avatar-zoom">Zoom</Label>
          <span className="text-sm tabular-nums text-muted-foreground">{zoom.toFixed(1)}×</span>
        </div>
        <div className="flex items-center gap-3">
          <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Slider id="avatar-zoom" aria-label="Photo zoom" min={1} max={3} step={0.01} value={[zoom]} disabled={saving || imageError} onValueChange={(values) => setZoom(values[0] ?? 1)} />
          <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>
        <Button variant="ghost" size="sm" disabled={saving || imageError} onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); }}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset
        </Button>
      </div>
    </Modal>
  );
}