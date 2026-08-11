export type LegalSection = {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

/**
 * Renders the section list of a legal page.
 *
 * The source copy uses run-in labels ("RETENTION. Lead and contact records
 * are kept…"). They become real headings here: a privacy policy is a document
 * people scan for one clause, and a run of undifferentiated paragraphs gives a
 * screen reader user no way to jump. The wording is unchanged — only its
 * markup.
 */
export function LegalSections({
  sections,
}: {
  sections: readonly LegalSection[];
}) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.bullets ? (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </>
  );
}
