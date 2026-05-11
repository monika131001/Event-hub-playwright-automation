import { Page } from "@playwright/test";
import loginCredentials from "../test-data/login_credentials.json";

class AuthHelper {

    constructor() {

    }

  async loginAndGoToEvents(page: Page) {
    await page.goto("https://eventhub.rahulshettyacademy.com/login");
    await page.locator("#email").fill( loginCredentials.email);
    await page.fill("#email", loginCredentials.email);
    await page.fill("#password", loginCredentials.password);
    await page.locator("#login-btn").click();
    await page.waitForURL("https://eventhub.rahulshettyacademy.com/");
    await page.locator("#nav-events").click();
  }
}

export default AuthHelper;