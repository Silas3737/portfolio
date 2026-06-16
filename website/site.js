(function () {
  const projectRows = Array.from(document.querySelectorAll(".project-row[data-href]"));

  projectRows.forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      window.location.href = row.dataset.href;
    });

    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      window.location.href = row.dataset.href;
    });
  });

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
