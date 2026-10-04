/**
 * Kill-scan rules shared by every prospect page's tests.
 *
 * "patient", ruled October 4, 2026, for every page now and future: the
 * exact phrase "no patient information" is our own privacy sentence and is
 * intentional, so it is allowed. Any other use of the word, in any case or
 * form ("patients", "patient names", "Patient data"), still fails the scan.
 */
export const ALLOWED_PATIENT_PHRASE = "no patient information";

/** Every use of "patient" left once the allowed phrase is set aside. */
export function patientTermsOutsideAllowlist(text: string): string[] {
  return (
    text
      .split(ALLOWED_PATIENT_PHRASE)
      .join(" ")
      .match(/patient/gi) ?? []
  );
}
