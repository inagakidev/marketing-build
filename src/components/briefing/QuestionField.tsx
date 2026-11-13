"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PublicQuestion } from "@/server/publicForm";
import type { AnswerValue } from "@/core";

/**
 * A form field, picked by the question's `answerType`.
 *
 * Choices are visible radios and checkboxes instead of a `select`: on mobile a
 * dropdown hides the options behind a tap, and seeing the alternatives side by
 * side helps answering — this is exactly where the respondent decides what the
 * form will ask next.
 */
export function QuestionField({
  question,
  value,
  invalid,
  onChange,
}: {
  question: PublicQuestion;
  value: AnswerValue | null;
  invalid?: boolean;
  onChange: (value: AnswerValue) => void;
}) {
  const fieldId = `q-${question.key}`;
  const describedBy = question.helpText ? `${fieldId}-help` : undefined;

  return (
    <div className="space-y-2.5">
      <Label
        htmlFor={fieldId}
        className="text-base font-medium leading-snug block"
      >
        {question.text}
        {question.required && (
          <span className="text-destructive ml-1" aria-hidden>
            *
          </span>
        )}
        {question.required && <span className="sr-only">(obrigatória)</span>}
      </Label>

      {question.helpText && (
        <p id={describedBy} className="text-sm text-muted-foreground">
          {question.helpText}
        </p>
      )}

      {renderControl()}

      {invalid && (
        <p className="text-sm text-destructive" role="alert">
          Esta pergunta precisa ser respondida.
        </p>
      )}
    </div>
  );

  function renderControl() {
    switch (question.answerType) {
      case "short_text":
        return (
          <Input
            id={fieldId}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            value={asText(value)}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "long_text":
        return (
          <Textarea
            id={fieldId}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            rows={4}
            className="resize-y"
            value={asText(value)}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "single_choice":
        return (
          <RadioGroup
            aria-describedby={describedBy}
            aria-invalid={invalid}
            value={asText(value)}
            onValueChange={onChange}
            className="gap-0 rounded-md border divide-y"
          >
            {(question.options ?? []).map((option) => (
              <Label
                key={option.value}
                htmlFor={`${fieldId}-${option.value}`}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 font-normal"
              >
                <RadioGroupItem
                  id={`${fieldId}-${option.value}`}
                  value={option.value}
                />
                <span className="leading-snug">{option.label}</span>
              </Label>
            ))}
          </RadioGroup>
        );

      case "multi_choice": {
        const selected = asList(value);
        return (
          <div
            className="rounded-md border divide-y"
            role="group"
            aria-describedby={describedBy}
          >
            {(question.options ?? []).map((option) => (
              <Label
                key={option.value}
                htmlFor={`${fieldId}-${option.value}`}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 font-normal"
              >
                <Checkbox
                  id={`${fieldId}-${option.value}`}
                  checked={selected.includes(option.value)}
                  onCheckedChange={(checked) => {
                    onChange(
                      checked
                        ? [...selected, option.value]
                        : selected.filter((v) => v !== option.value),
                    );
                  }}
                />
                <span className="leading-snug">{option.label}</span>
              </Label>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  }
}

function asText(value: AnswerValue | null): string {
  if (value == null) return "";
  return Array.isArray(value) ? value.join(", ") : value;
}

function asList(value: AnswerValue | null): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
