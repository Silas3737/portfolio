(function () {
  const pageNavLinks = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
  const pageSections = pageNavLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (pageNavLinks.length && pageSections.length) {
    const setActiveNavLink = (sectionId) => {
      pageNavLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${sectionId}`);
      });
    };

    setActiveNavLink(pageSections[0].id);

    if ("IntersectionObserver" in window) {
      const pageNavObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveNavLink(entry.target.id);
          });
        },
        { rootMargin: "-36% 0px -52% 0px", threshold: 0.01 }
      );

      pageSections.forEach((section) => pageNavObserver.observe(section));
    }
  }

  const projectShowcase = document.querySelector("[data-project-showcase]");

  if (projectShowcase) {
    const projectNodes = Array.from(projectShowcase.querySelectorAll(".project-node"));
    const resultSets = Array.from(projectShowcase.querySelectorAll(".project-result-set"));

    const readProjectTone = (tone) => {
      const styles = getComputedStyle(projectShowcase);
      const color = styles.getPropertyValue(`--project-${tone}`).trim();
      const soft = styles.getPropertyValue(`--project-${tone}-soft`).trim();
      return [
        color || styles.getPropertyValue("--project-green").trim(),
        soft || styles.getPropertyValue("--project-green-soft").trim(),
      ];
    };

    const setActiveProject = (node) => {
      const project = node.dataset.project;
      const [activeColor, activeSoft] = readProjectTone(node.dataset.tone || "green");

      projectShowcase.style.setProperty("--project-active-color", activeColor);
      projectShowcase.style.setProperty("--project-active-soft", activeSoft);

      projectNodes.forEach((item) => {
        const isActive = item === node;
        item.classList.toggle("is-active", isActive);
        item
          .querySelectorAll(".project-node-trigger, .project-card-button")
          .forEach((control) => control.setAttribute("aria-pressed", String(isActive)));
      });

      resultSets.forEach((set) => {
        set.classList.toggle("is-active", set.dataset.resultProject === project);
      });
    };

    projectNodes.forEach((node) => {
      node.querySelector(".project-node-trigger")?.addEventListener("click", () => setActiveProject(node));
      node.querySelector(".project-map-card")?.addEventListener("click", (event) => {
        if (event.target.closest(".project-action")) return;
        setActiveProject(node);
      });
    });
  }

  const revealItems = Array.from(document.querySelectorAll(".reveal, .case-section, .case-story-block"));

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const tocLinks = Array.from(document.querySelectorAll(".case-toc a"));
  const sections = tocLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (tocLinks.length && "IntersectionObserver" in window) {
    const tocObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tocLinks.forEach((link) => link.classList.remove("active"));
            const activeLink = tocLinks.find((link) => link.getAttribute("href") === `#${entry.target.id}`);
            if (activeLink) activeLink.classList.add("active");
          }
        });
      },
      { rootMargin: "-24% 0px -64% 0px", threshold: 0.01 }
    );

    sections.forEach((section) => tocObserver.observe(section));
  }
})();
