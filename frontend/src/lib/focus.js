// After a failed submit, move the keyboard focus to the first bad field,
// so the user (and screen readers) land on the error at once.
export function focusFirstError(container) {
  requestAnimationFrame(() =>
    container?.querySelector('[aria-invalid="true"]')?.focus(),
  );
}
