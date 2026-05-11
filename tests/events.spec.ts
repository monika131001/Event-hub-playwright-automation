import test from "@playwright/test";
import AuthHelper from "../utils/authHelper";


test("Banner validation test", async ({page}) => {
    const authHelper = new AuthHelper();
    await authHelper.loginAndGoToEvents(page);
    console.log(page.locator(".text-3xl").textContent());
})