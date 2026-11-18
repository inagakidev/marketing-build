"use client";

import { CircleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PublicQuestion } from "@/server/publicForm";
import type { AnswerValue } from "@/core";

const LABEL_CLASS = "text-base leading-6 font-semibold lg:text-[1.0625rem] lg:leading-[1.625rem]";

/**
 * A form field, picked by the question's `answerType`, after DS v2 frames F2
 * and F6.
 *
 * Choices are visible cards instead of a `select`: on mobile a dropdown hides
 * the options behind a tap, and seeing the alternatives side by side helps
 * answering — this is exactly where the respondent decides what the form will
 * ask next. They're native radios and checkboxes inside a `fieldset`, so the
 * keyboard and screen readers get the platform's behavior.
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
  const helpId = question.helpText ? `${fieldId}-help` : undefined;
  const errorId = invalid ? `${fieldId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;
  const isChoice = question.answerType === "single_choice" || question.answerType === "multi_choice";

  const heading = (
    <>
      {question.text}
      {question.required ? (
        <>
          <span className="ml-1 text-destructive" aria-hidden>
            *
          </span>
          <span className="sr-only"> (obrigatória)</span>
        </>
      ) : null}
    </>
  );

  const body = (
    <div className="flex flex-col gap-2">
      {isChoice ? null : (
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={fieldId} className={LABEL_CLASS}>
            {heading}
          </label>
          {!question.required && <OptionalTag />}
        </div>
      )}

      {question.helpText && !isChoice && (
        <p id={helpId} className="text-sm leading-5 text-muted-foreground">
          {question.helpText}
        </p>
      )}

      {renderControl()}

      {invalid && (
        <p id={errorId} className="flex items-start gap-1.5 text-sm leading-5 text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Responda esta pergunta para continuar. Se não souber, escreva do seu jeito ou “ainda não sei”.
        </p>
      )}
    </div>
  );

  if (!question.conditional) return body;

  // DS v2 F2: a question revealed by an earlier answer says so, so the form
  // growing doesn't look like a bug.
  return (
    <div className="flex flex-col gap-2 border-l-2 border-(--brand-300) pl-3.5 lg:pl-4">
      <span className="text-xs font-semibold text-(--link)">Pergunta nova, com base na sua resposta</span>
      {body}
    </div>
  );

  function renderControl() {
    switch (question.answerType) {
      case "short_text":
        return (
          <Input
            id={fieldId}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            value={asText(value)}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "long_text":
        return (
          <Textarea
            id={fieldId}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            rows={4}
            className="resize-y"
            value={asText(value)}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "single_choice": {
        const options = question.options ?? [];
        return (
          <fieldset id={fieldId} aria-describedby={describedBy} aria-invalid={invalid || undefined} className="m-0 border-0 p-0">
            <ChoiceLegend heading={heading} required={question.required} helpText={question.helpText} helpId={helpId} />
            <div className={`grid gap-2.5 ${options.length <= 3 ? "lg:grid-cols-3" : ""}`}>
              {options.map((option) => (
                <label
                  key={option.value}
                  className={`flex min-h-14 cursor-pointer items-center gap-3.5 rounded-xl border bg-card px-4 py-3.5 text-base font-medium transition-colors duration-(--duration-fast) has-checked:border-foreground has-checked:ring-1 has-checked:ring-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring hover:bg-muted ${
                    invalid ? "border-destructive" : "border-input"
                  }`}
                >
                  <input
                    type="radio"
                    name={fieldId}
                    value={option.value}
                    checked={asText(value) === option.value}
                    onChange={() => onChange(option.value)}
                    className="size-5 shrink-0 accent-(--primary)"
                  />
                  <span className="leading-snug">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      }

      case "multi_choice": {
        const selected = asList(value);
        return (
          <fieldset id={fieldId} aria-describedby={describedBy} aria-invalid={invalid || undefined} className="m-0 border-0 p-0">
            <ChoiceLegend
              heading={heading}
              required={question.required}
              helpText={question.helpText}
              helpId={helpId}
              hint="marque todas que se aplicam"
            />
            <div className="flex flex-wrap gap-2.5">
              {(question.options ?? []).map((option) => (
                <label
                  key={option.value}
                  className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border bg-card px-3.5 py-2 text-[0.9375rem] transition-colors duration-(--duration-fast) has-checked:border-foreground has-checked:ring-1 has-checked:ring-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring hover:bg-muted ${
                    invalid ? "border-destructive" : "border-input"
                  }`}
                >
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={selected.includes(option.value)}
                    onChange={(e) =>
                      onChange(
                        e.target.checked
                          ? [...selected, option.value]
                          : selected.filter((v) => v !== option.value),
                      )
                    }
                    className="size-[18px] shrink-0 accent-(--primary)"
                  />
                  <span className="leading-snug">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      }

      default:
        return null;
    }
  }
}

function ChoiceLegend({
  heading,
  required,
  helpText,
  helpId,
  hint,
}: {
  heading: React.ReactNode;
  required: boolean;
  helpText: string | null;
  helpId?: string;
  hint?: string;
}) {
  return (
    <>
      <legend className={`mb-2.5 p-0 ${LABEL_CLASS}`}>
        {heading}
        {hint && <span className="font-normal text-muted-foreground"> · {hint}</span>}
        {!required && (
          <span className="ml-2 align-middle text-[0.8125rem] font-normal text-muted-foreground">Opcional</span>
        )}
      </legend>
      {helpText && (
        <p id={helpId} className="-mt-1 mb-3 text-sm leading-5 text-muted-foreground">
          {helpText}
        </p>
      )}
    </>
  );
}

function OptionalTag() {
  return <span className="shrink-0 text-[0.8125rem] text-muted-foreground">Opcional</span>;
}

function asText(value: AnswerValue | null): string {
  if (value == null) return "";
  return Array.isArray(value) ? value.join(", ") : value;
}

function asList(value: AnswerValue | null): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
