import { BasePage } from "../base.page.js";

export class BerandaPage extends BasePage {
  path = "/";

  constructor(page) {
    super(page);
    this.heroTitle = page.getByRole("heading", { level: 1 });
    this.featuresSection = page.locator("#features");
    this.aboutSection = page.locator("#about");
    this.signUpCta = page.getByRole("button", { name: "Buat Akun Gratis" });
    this.startNowButton = page.getByRole("button", { name: "Mulai Sekarang" });
    this.faqTitle = page.getByText("Tanya jawab (FAQ) LangkahLegal");
    this.copyright = page.getByText(`© ${new Date().getFullYear()} LangkahLegal`);
    this.navbar = page.getByRole("navigation");
    this.servicesLink = page.getByRole("link", { name: "Services" });
  }

  navbarButton(name) {
    return this.navbar.getByRole("button", { name });
  }

  faqQuestion(text) {
    return this.page.getByRole("button", { name: new RegExp(text) });
  }

  faqAnswer(text) {
    return this.page.getByText(new RegExp(text));
  }

  horizontalOverflow() {
    return this.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  }
}
