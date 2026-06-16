import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "src", "pages");
const outputDir = path.join(root, "website");
const assetVersion = "20260617-04";
const siteUrl = "https://silas3737.github.io/portfolio";

const pages = [
  {
    source: "index.html",
    output: "index.html",
    stylesheet: "home.css",
    title: "侯泽航作品集首页",
    description: "侯泽航交互设计师作品集，聚焦复杂业务场景中的信息架构、任务流程和产品体验效率提升。",
    ogTitle: "侯泽航作品集",
    ogDescription: "复杂业务体验效率提升设计师，代表案例覆盖影视制片管理、低代码平台和移动任务产品。",
    ogType: "website",
    ogImage: `${siteUrl}/assets/case-films-bond.jpg`,
    canonical: `${siteUrl}/`,
    nav: "home",
    script: "site.js",
  },
  {
    source: "about.html",
    output: "about.html",
    stylesheet: "case.css",
    title: "关于侯泽航｜交互设计师作品集",
    description: "侯泽航的职业背景、核心能力和联系方式，聚焦复杂业务场景中的产品体验效率提升。",
    ogTitle: "关于侯泽航",
    ogDescription: "交互设计师 / UX 设计师 / 产品体验设计师，关注信息架构、流程设计和体验效率。",
    ogType: "profile",
    ogImage: `${siteUrl}/assets/case-films-bond.jpg`,
    canonical: `${siteUrl}/about.html`,
    nav: "page",
  },
  {
    source: "cases/films-bond.html",
    output: "cases/films-bond.html",
    stylesheet: "../case.css",
    title: "影保宝制片管理系统｜侯泽航作品集",
    description: "影保宝制片管理系统案例详情，说明复杂影视制片流程数字化和拍摄计划制作效率提升。",
    ogTitle: "影保宝制片管理系统｜侯泽航作品集",
    ogDescription: "把复杂影视制片流程转化为可执行的拍摄计划工具，提升制片管理效率。",
    ogType: "article",
    ogImage: `${siteUrl}/assets/case-films-bond.jpg`,
    canonical: `${siteUrl}/cases/films-bond.html`,
    nav: "case",
    script: "../site.js",
  },
  {
    source: "cases/lowcode.html",
    output: "cases/lowcode.html",
    stylesheet: "../case.css",
    title: "矩阵低代码平台易学性提升｜侯泽航作品集",
    description: "矩阵低代码平台易学性提升案例详情，说明复杂 B 端工具的学习路径、上下文提示和操作路径优化。",
    ogTitle: "矩阵低代码平台易学性提升｜侯泽航作品集",
    ogDescription: "降低低代码平台学习成本，让业务人员更快完成应用搭建。",
    ogType: "article",
    ogImage: `${siteUrl}/assets/case-lowcode.jpg`,
    canonical: `${siteUrl}/cases/lowcode.html`,
    nav: "case",
    script: "../site.js",
  },
  {
    source: "cases/xingzhi.html",
    output: "cases/xingzhi.html",
    stylesheet: "../case.css",
    title: "行志 APP 改版｜侯泽航作品集",
    description: "行志 APP 改版案例详情，说明任务管理产品的体验诊断、流程重构和任务创建效率提升。",
    ogTitle: "行志 APP 改版｜侯泽航作品集",
    ogDescription: "通过任务序列重构和信息分层，提升任务创建效率。",
    ogType: "article",
    ogImage: `${siteUrl}/assets/case-xingzhi.jpg`,
    canonical: `${siteUrl}/cases/xingzhi.html`,
    nav: "case",
    script: "../site.js",
  },
];

function indented(value, spaces = 2) {
  const padding = " ".repeat(spaces);
  return value
    .trim()
    .split("\n")
    .map((line) => `${padding}${line}`)
    .join("\n");
}

function renderHead(page) {
  return `<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${page.title}</title>
  <meta name="description" content="${page.description}" />
  <meta property="og:title" content="${page.ogTitle}" />
  <meta property="og:description" content="${page.ogDescription}" />
  <meta property="og:type" content="${page.ogType}" />
  <meta property="og:image" content="${page.ogImage}" />
  <link rel="canonical" href="${page.canonical}" />
  <link rel="stylesheet" href="${page.stylesheet}?v=${assetVersion}" />
</head>`;
}

function renderNav(page) {
  const navByType = {
    home: {
      headerClass: "site-header",
      homeHref: "#work",
      links: [
        ["作品", "#cases", false],
        ["关于", "#about", false],
        ["联系", "#contact", false],
      ],
    },
    page: {
      headerClass: "topbar",
      homeHref: "index.html",
      links: [
        ["作品", "index.html#cases", false],
        ["案例", "index.html#cases", false],
        ["关于", "about.html", true],
        ["联系", "index.html#contact", false],
      ],
    },
    case: {
      headerClass: "topbar",
      homeHref: "../index.html",
      links: [
        ["作品", "../index.html#cases", false],
        ["案例", "../index.html#cases", true],
        ["关于", "../about.html", false],
        ["联系", "../index.html#contact", false],
      ],
    },
  };
  const nav = navByType[page.nav];
  const links = nav.links
    .map(([label, href, current]) => `        <a href="${href}"${current ? ' aria-current="page"' : ""}>${label}</a>`)
    .join("\n");

  return `<a class="skip-link" href="#main-content">跳过导航</a>
<header class="${nav.headerClass}">
  <nav class="nav" aria-label="主导航">
    <a class="brand" href="${nav.homeHref}" aria-label="返回首页">首页</a>
    <div class="nav-links">
${links}
    </div>
  </nav>
</header>`;
}

function renderPage(page) {
  const main = readFileSync(path.join(sourceDir, page.source), "utf8").trim();
  const script = page.script ? `\n  <script src="${page.script}?v=${assetVersion}"></script>` : "";

  return `<!doctype html>
<html lang="zh-CN">
${renderHead(page)}
<body>
${indented(renderNav(page), 2)}
${indented(main, 2)}${script}
</body>
</html>
`;
}

for (const page of pages) {
  const target = path.join(outputDir, page.output);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, renderPage(page));
}

console.log(`Generated ${pages.length} HTML files.`);
