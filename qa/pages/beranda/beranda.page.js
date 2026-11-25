import { BasePage } from "../base.page.js";

export class BerandaPage extends BasePage {
  path = "/";

  constructor(page) {
    super(page);
    this.heroTitle = page.getByTestId("landing-hero-title");
    this.featuresSection = page.getByTestId("landing-features-section");
    this.aboutSection = page.getByTestId("landing-about-section");
    this.signUpCta = page.getByTestId("landing-signup-cta-btn");
    this.startNowButton = page.getByTestId("landing-start-btn");
    this.faqTitle = page.getByTestId("landing-faq-title");
    this.copyright = page.getByTestId("footer-copyright").filter({ hasText: `© ${new Date().getFullYear()} LangkahLegal` });
    this.navbar = page.getByTestId("navbar");
    this.servicesLink = page.getByTestId("navbar-link-features");
  }

  navbarButton(name) {
    return this.navbar.getByTestId("navbar-cta-btn").filter({ hasText: name });
  }

  faqQuestion(text) {
    return this.page.getByTestId("landing-faq-question-btn").filter({ hasText: new RegExp(text) });
  }

  faqAnswer(text) {
    return this.page.getByTestId("landing-faq-answer").filter({ hasText: new RegExp(text) });
  }

  horizontalOverflow() {
    return this.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  }
}
