import { test, expect, Page } from "@playwright/test";
import LoginPage from "../pages/LoginPage";
import { GMAIL_USER, YAHOO_USER } from "../test-data/email_credentials";
import { FOUR_EVENTS_RESPONSE, SIX_EVENTS_RESPONSE } from "../test-data/mock_event";
import { BASE_URL } from "../utils/constants";

async function loginAs(page: Page, user: { email: string; password: string }) {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('you@email.com').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.locator('#login-btn').click();
    await expect(page.getByRole('link', { name: 'Browse Events →' })).toBeVisible();
}


// Verify sandbox banner is displayed when API returns 6 events
test("Sandbox banner is shown when 6 events are returned", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Mock events API response with 6 events
    await page.route("**/api/events**", async route => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(SIX_EVENTS_RESPONSE),
        });
    }
    );

    // Login and navigate to events page
    await loginPage.loginAndGoToEvents();

    // Verify at least one event card is visible and have count 6
    await expect(page.locator("[data-testid='event-card']").first()).toBeVisible();
    await expect(page.locator("[data-testid='event-card']")).toHaveCount(6);

    // Locate sandbox banner and assert it is visible
    const sandbox = page.getByText(/sandbox holds up to/i);
    await expect(sandbox).toBeVisible();

    // Verify booking information text
    await expect(sandbox).toContainText("9 bookings");
}
);

// Verify sandbox banner is hidden when API returns only 4 events
test("Sandbox banner is hidden when 4 events are returned", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Mock events API response with 4 events
    await page.route("**/api/events**", async route => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(FOUR_EVENTS_RESPONSE),
        });
    }
    );

    // Login and navigate to events page
    await loginPage.loginAndGoToEvents();

    // Verify at least one event card is visible and have count 4
    await expect(page.locator("[data-testid='event-card']").first()).toBeVisible();
    await expect(page.locator("[data-testid='event-card']")).toHaveCount(4);

    // Locate sandbox banner and assert it is not visible
    const sandbox = page.getByText(/sandbox holds up to/i);
    await expect(sandbox).not.toBeVisible();
}
);

test("Cross User booking access denied", async ({ page }) => {

    // Login as Yahoo user via API to get authentication token
    const loginRes = await page.request.post("https://api.eventhub.rahulshettyacademy.com/api/auth/login", {
        data: { email: YAHOO_USER.email, password: YAHOO_USER.password },
    })

    // Verify login API call is successful
    expect(loginRes.ok()).toBeTruthy();

    // Parse login response JSON and extract token
    const loginResJSON = await loginRes.json();
    const token = loginResJSON.token;

    // Fetch available events using authenticated token
    const eventsRes = await page.request.get("https://api.eventhub.rahulshettyacademy.com/api/events", {
        headers: {
            Authorization: `Bearer ${token}`}
    })

    // Verify events API call is successful
    expect(eventsRes.ok()).toBeTruthy();

    // Parse login response JSON and extract event ID
    const eventsResJSON = await eventsRes.json();
    const eventId = eventsResJSON.data[0].id;
    console.log(eventId);

    // Booking payload data for Yahoo user
    const bookingPayload = {
        eventId, customerName: "Yahoo User", customerEmail: YAHOO_USER.email, customerPhone: "2223334445", quantity: 1
    }

    // Create booking as Yahoo user
    const bookingRes = await page.request.post("https://api.eventhub.rahulshettyacademy.com/api/bookings", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        data: bookingPayload
    })

    // Verify booking creation API call is successful
    expect(bookingRes.ok()).toBeTruthy();

    // Parse login response JSON and extract Booking ID
    const bookingResJSON = await bookingRes.json();
    const yahooBookingId = bookingResJSON.data.id;

    // Login to UI as Gmail user
    await loginAs(page, GMAIL_USER);

    // Navigate directly to Yahoo user's booking page
    await page.goto(`/bookings/${yahooBookingId}`, { waitUntil: "networkidle" });

    // Verify Gmail user is denied access to Yahoo booking
    await expect(page.getByText("Access Denied")).toBeVisible();

    // Verify unauthorized access message is displayed
    await expect(page.getByText("You are not authorized to view this booking")).toBeVisible();
})