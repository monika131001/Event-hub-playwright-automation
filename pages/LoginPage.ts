import { Locator, Page } from "@playwright/test";
import loginCredentials from "../test-data/login_credentials.json";

class LoginPage {
  private page: Page;

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly eventsNavLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.loginButton = page.locator("#login-btn");
    this.eventsNavLink = page.locator("#nav-events");
  }

  async loginAndGoToEvents() {
    await this.page.goto("/login");
    await this.emailInput.fill(loginCredentials.email);
    await this.passwordInput.fill(loginCredentials.password);
    await this.loginButton.click();
    await this.page.waitForURL("/");
    await this.eventsNavLink.click();
  }
}

export default LoginPage;