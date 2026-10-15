// Marks the tab of the section currently in view with aria-current.
export function initTabs() {
  const tabs = [...document.querySelectorAll('.tabs__tab')];
  const byId = new Map(tabs.map((tab) => [tab.hash.slice(1), tab]));
  const sections = [...document.querySelectorAll('[data-section]')];

  const setActive = (id) => {
    for (const [tabId, tab] of byId) {
      if (tabId === id) {
        tab.setAttribute('aria-current', 'true');
        tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } else {
        tab.removeAttribute('aria-current');
      }
    }
  };

  // A section is active while it crosses a line at 40% of the viewport height.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
      }
    },
    { rootMargin: '-40% 0px -59% 0px' },
  );
  sections.forEach((section) => observer.observe(section));
  setActive(sections[0]?.id);
}
