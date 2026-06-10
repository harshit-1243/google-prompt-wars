import axe from "axe-core";

/**
 * Run axe-core accessibility checks against a rendered container.
 *
 * Page-scope rules (document title, single main landmark, etc.) and
 * `color-contrast` (which needs a real layout engine jsdom doesn't provide)
 * are disabled, since we test components in isolation rather than whole pages.
 */
export async function a11yViolations(
  container: HTMLElement,
): Promise<axe.Result[]> {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
      "document-title": { enabled: false },
      "html-has-lang": { enabled: false },
      "landmark-one-main": { enabled: false },
      "page-has-heading-one": { enabled: false },
      bypass: { enabled: false },
    },
  });
  return results.violations;
}
