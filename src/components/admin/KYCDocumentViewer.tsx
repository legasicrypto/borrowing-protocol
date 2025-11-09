import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface KYCDocumentViewerProps {
  kycSubmission: {
    id: string;
    first_name: string;
    last_name: string;
    id_document_url?: string;
    proof_address_url?: string;
    selfie_url?: string;
  };
  open: boolean;
  onClose: () => void;
}

export function KYCDocumentViewer({ kycSubmission, open, onClose }: KYCDocumentViewerProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadDocument = async (path: string, filename: string) => {
    setDownloading(path);
    try {
      const { data, error } = await supabase.storage
        .from("kyc-documents")
        .download(path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Document téléchargé");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setDownloading(null);
    }
  };

  const viewDocument = async (path: string) => {
    try {
      const { data } = await supabase.storage
        .from("kyc-documents")
        .createSignedUrl(path, 3600); // 1 hour

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("View error:", error);
      toast.error("Erreur lors de l'affichage");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Documents KYC - {kycSubmission.first_name} {kycSubmission.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ID Document */}
          {kycSubmission.id_document_url && (
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Pièce d'identité</p>
                  <p className="text-sm text-muted-foreground">
                    {kycSubmission.id_document_url.split("/").pop()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewDocument(kycSubmission.id_document_url!)}
                >
                  Voir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadDocument(
                      kycSubmission.id_document_url!,
                      `id-${kycSubmission.first_name}-${kycSubmission.last_name}.${
                        kycSubmission.id_document_url!.split(".").pop()
                      }`
                    )
                  }
                  disabled={downloading === kycSubmission.id_document_url}
                >
                  {downloading === kycSubmission.id_document_url ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Proof of Address */}
          {kycSubmission.proof_address_url && (
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Justificatif de domicile</p>
                  <p className="text-sm text-muted-foreground">
                    {kycSubmission.proof_address_url.split("/").pop()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewDocument(kycSubmission.proof_address_url!)}
                >
                  Voir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadDocument(
                      kycSubmission.proof_address_url!,
                      `address-${kycSubmission.first_name}-${kycSubmission.last_name}.${
                        kycSubmission.proof_address_url!.split(".").pop()
                      }`
                    )
                  }
                  disabled={downloading === kycSubmission.proof_address_url}
                >
                  {downloading === kycSubmission.proof_address_url ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Selfie */}
          {kycSubmission.selfie_url && (
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Selfie</p>
                  <p className="text-sm text-muted-foreground">
                    {kycSubmission.selfie_url.split("/").pop()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewDocument(kycSubmission.selfie_url!)}
                >
                  Voir
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    downloadDocument(
                      kycSubmission.selfie_url!,
                      `selfie-${kycSubmission.first_name}-${kycSubmission.last_name}.${
                        kycSubmission.selfie_url!.split(".").pop()
                      }`
                    )
                  }
                  disabled={downloading === kycSubmission.selfie_url}
                >
                  {downloading === kycSubmission.selfie_url ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {!kycSubmission.id_document_url &&
            !kycSubmission.proof_address_url &&
            !kycSubmission.selfie_url && (
              <p className="text-center text-muted-foreground py-8">
                Aucun document disponible
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
