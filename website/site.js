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
