"use client";

import type {
	Form as CrevioForm,
	FormField as CrevioFormField,
} from "@crevio/sdk/models";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type SubmitFormState, submitForm } from "@/lib/actions/submit-form";

interface FormFieldsProps {
	form: CrevioForm;
	heading?: string;
	description?: string;
	submitLabel: string;
	className?: string;
}

const initialState: SubmitFormState = { status: "idle" };

function SubmitButton({ label }: { label: string }) {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" disabled={pending} className="w-full sm:w-auto">
			{pending ? (
				<>
					<Loader2 className="size-4 animate-spin" />
					Submitting
				</>
			) : (
				label
			)}
		</Button>
	);
}

export function FormFields({
	form,
	heading,
	description,
	submitLabel,
	className,
}: FormFieldsProps) {
	const action = submitForm.bind(null, form.id);
	const [state, formAction] = useActionState(action, initialState);
	const previous = state.status === "error" ? state.values : undefined;

	if (state.status === "success") {
		return (
			<div className={className}>
				<div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-10 text-center">
					<div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
						<CheckCircle2 className="size-6" />
					</div>
					<p className="max-w-md text-sm text-muted-foreground">
						{state.message}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={className}>
			{(heading || description) && (
				<div className="mb-6">
					{heading && (
						<h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
					)}
					{description && (
						<p className="mt-2 text-sm text-muted-foreground">{description}</p>
					)}
				</div>
			)}

			<form action={formAction} className="grid gap-4">
				{form.formFields.map((field) => (
					<Field key={field.id} field={field} previous={previous?.[field.id]} />
				))}

				{state.status === "error" && state.message && (
					<p className="text-sm text-destructive" role="alert">
						{state.message}
					</p>
				)}

				<div className="flex items-center justify-end pt-2">
					<SubmitButton label={submitLabel} />
				</div>
			</form>
		</div>
	);
}

function Field({
	field,
	previous,
}: {
	field: CrevioFormField;
	previous?: string | string[];
}) {
	const labelId = `field-${field.id}`;
	const requiredMark = field.required ? (
		<span className="text-destructive"> *</span>
	) : null;
	const previousString = Array.isArray(previous) ? "" : (previous ?? "");
	const previousArray = Array.isArray(previous) ? previous : [];

	return (
		<div className="grid gap-2">
			<Label htmlFor={labelId}>
				{field.name}
				{requiredMark}
			</Label>

			{(field.fieldType === "email" ||
				field.fieldType === "text" ||
				field.fieldType === "phone") && (
				<Input
					id={labelId}
					name={field.id}
					type={field.fieldType === "phone" ? "tel" : field.fieldType}
					required={field.required ?? false}
					autoComplete={
						field.fieldType === "email"
							? "email"
							: field.fieldType === "phone"
								? "tel"
								: undefined
					}
					defaultValue={previousString}
				/>
			)}

			{field.fieldType === "textarea" && (
				<Textarea
					id={labelId}
					name={field.id}
					rows={5}
					required={field.required ?? false}
					defaultValue={previousString}
				/>
			)}

			{field.fieldType === "select" && (
				<select
					id={labelId}
					name={field.id}
					required={field.required ?? false}
					defaultValue={previousString}
					className="flex h-9 w-full items-center rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					<option value="">Select…</option>
					{field.options.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
			)}

			{field.fieldType === "radio" && (
				<div className="grid gap-2">
					{field.options.map((option) => (
						<label key={option} className="flex items-center gap-2 text-sm">
							<input
								type="radio"
								name={field.id}
								value={option}
								required={field.required ?? false}
								defaultChecked={previousString === option}
								className="size-4"
							/>
							{option}
						</label>
					))}
				</div>
			)}

			{field.fieldType === "checkbox" && (
				<div className="grid gap-2">
					{field.options.map((option) => (
						<label key={option} className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								name={field.id}
								value={option}
								defaultChecked={previousArray.includes(option)}
								className="size-4"
							/>
							{option}
						</label>
					))}
				</div>
			)}
		</div>
	);
}
