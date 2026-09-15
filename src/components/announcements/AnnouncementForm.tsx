"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  announcementSchema,
  fieldErrorsFromZod,
  type AnnouncementInput,
} from "@/lib/validation/schemas";

export function AnnouncementForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (input: AnnouncementInput) => Promise<string | null>;
  submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = announcementSchema.safeParse({ title, body });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      return;
    }
    setFieldErrors({});

    const error = await onSubmit(parsed.data);
    if (error) {
      setFormError(error);
      return;
    }
    setTitle("");
    setBody("");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}

      <FormField label="Title" htmlFor="announcement-title" error={fieldErrors.title}>
        <Input
          id="announcement-title"
          name="title"
          value={title}
          invalid={Boolean(fieldErrors.title)}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What does the team need to know?"
          maxLength={120}
        />
      </FormField>

      <FormField
        label="Details"
        htmlFor="announcement-body"
        error={fieldErrors.body}
        hint={`${body.length.toLocaleString()}/2,000 characters`}
      >
        <Textarea
          id="announcement-body"
          name="body"
          value={body}
          invalid={Boolean(fieldErrors.body)}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Share the details…"
        />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>
          Post announcement
        </Button>
      </div>
    </form>
  );
}
