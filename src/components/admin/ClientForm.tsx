"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface ClientFormValues {
  name: string;
  contactEmail: string;
  phone: string;
  projectType: string;
  internalNotes: string;
}

/** Client creation and editing. A single component for both cases. */
export function ClientForm({
  clientId,
  initial,
}: {
  clientId?: string;
  initial?: Partial<ClientFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ClientFormValues>({
    name: initial?.name ?? "",
    contactEmail: initial?.contactEmail ?? "",
    phone: initial?.phone ?? "",
    projectType: initial?.projectType ?? "",
    internalNotes: initial?.internalNotes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = Boolean(clientId);

  function update(field: keyof ClientFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        editing ? `/api/clients/${clientId}` : "/api/clients",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao salvar.");

      toast.success(editing ? "Cliente atualizado." : "Cliente cadastrado.");
      router.push(`/admin/clientes/${data.client.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    // The page header (PageHeader) carries the title.
    <Card className="max-w-2xl">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              required
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">E-mail de contato *</Label>
              <Input
                id="contactEmail"
                type="email"
                required
                value={values.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={values.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectType">Tipo de projeto</Label>
            <Input
              id="projectType"
              placeholder="Ex.: reposicionamento de marca"
              value={values.projectType}
              onChange={(e) => update("projectType", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">Notas internas</Label>
            <Textarea
              id="internalNotes"
              rows={4}
              placeholder="Só você vê. Nunca aparece para o cliente."
              value={values.internalNotes}
              onChange={(e) => update("internalNotes", e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar" : "Cadastrar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
