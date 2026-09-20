I am building a free, privacy-first password manager called "Keynest".

Tagline:
"Private home for your digital keys."

Product description:
Keynest is a modern password manager for securely storing login credentials, generating strong passwords, and protecting the user's vault with modern encryption and two-factor authentication.

I want you to design the COMPLETE frontend structure and UX for the application.

IMPORTANT:

- Focus on product structure, UX, UI, navigation, screens, states, and reusable components.
- Do NOT implement the backend, database, authentication provider, encryption, or cryptography.
- Do NOT invent insecure security mechanisms.
- Treat the vault as client-side encrypted and assume the server never receives plaintext vault contents.
- Authentication will eventually use Google Sign-In and Microsoft Sign-In.
- The user should NOT need to create another password specifically for Keynest if we use OAuth.
- MFA/2FA should still be supported for protecting the Keynest account where appropriate.
- Design the UI so authentication can later be connected to an OAuth provider without changing the UX.

TECH STACK CONTEXT:

- React
- React Router
- TypeScript
- Tailwind CSS
- Component-based architecture
- Responsive web application
- Desktop-first but fully usable on mobile

PRODUCT GOALS:

1. Extremely simple to understand.
2. Fast to use every day.
3. Clean, modern, trustworthy security-focused design.
4. Avoid the intimidating "enterprise security software" look.
5. Make the vault the central experience.
6. Make adding and retrieving credentials extremely fast.
7. Make the password generator a first-class feature.
8. Clearly communicate security without overwhelming the user.

==================================================
APP INFORMATION ARCHITECTURE
==================================================

Main authenticated application:

/vault
/generator
/favorites
/secure-notes
/settings
/settings/security
/settings/account

Main navigation:

SIDEBAR

- All Items
- Favorites
- Logins
- Secure Notes
- Password Generator

Then a divider.

- Recently Added
- Recently Used

Bottom:

- Settings
- Help
- User profile/avatar

On mobile, convert the sidebar into a mobile navigation/drawer.

==================================================
VAULT
==================================================

The Vault is the primary screen.

Layout:

Header:

- "My Vault"
- Search field
- Add Item button
- User avatar/menu

Below:

- Quick actions
  - Add Login
  - Generate Password
  - Add Secure Note

Main content:

- Recently used items
- Favorites
- All vault items

Each vault item should display:

- Website/app icon where available
- Item name
- Username/email
- Favorite state
- Last updated/used information

Example:

Google
john@example.com

GitHub
john@example.com

Netflix
john@example.com

Clicking an item opens its detail view.

==================================================
SEARCH
==================================================

Search should feel extremely fast and central to the product.

Create a command-palette style search experience.

Keyboard shortcut:
Cmd/Ctrl + K

Search should be able to find:

- Login names
- Usernames
- URLs
- Secure notes

Show results grouped by type.

Example:

Search "github"

LOGINS
GitHub
john@example.com

SECURE NOTES
GitHub recovery codes

Include empty, loading, and no-results states.

==================================================
LOGIN ITEM
==================================================

Create an "Add Login" form.

Fields:

- Name
- Website URL
- Username/email
- Password
- Notes
- Favorite
- Tags

Password field needs:

- Show/hide
- Copy
- Generate password

When clicking Generate:
open a password generator popover/modal.

Generated password should have:

- Length slider/input
- Uppercase
- Lowercase
- Numbers
- Symbols
- Exclude ambiguous characters
- Generate button
- Copy button

Also support passphrases:

- Number of words
- Separator
- Capitalization

The login detail page should clearly separate:

LOGIN
Website
Username
Password

SECURITY
Password strength
Last changed
2FA/TOTP status

NOTES
Notes

A password should be hidden by default.

Copy buttons should provide clear temporary feedback.

==================================================
PASSWORD GENERATOR
==================================================

Create a dedicated /generator page.

This should be a polished, useful standalone tool.

Large generated password display.

Controls:

Password

- Length
- Uppercase
- Lowercase
- Numbers
- Symbols
- Exclude ambiguous characters

Passphrase

- Number of words
- Separator
- Capitalization

Actions:

- Generate
- Copy

Show password strength visually, but don't imply that a simple score guarantees security.

The generator should work without requiring a vault item.

==================================================
SECURE NOTES
==================================================

Users can create encrypted secure notes.

Fields:

- Title
- Content
- Favorite
- Tags

List view similar to vault items.

Detail view should provide:

- Edit
- Delete
- Favorite
- Copy where appropriate

==================================================
FAVORITES
==================================================

Dedicated page showing favorited items.

Group by:

- Logins
- Secure Notes

Provide empty state encouraging users to favorite frequently used items.

==================================================
SETTINGS
==================================================

Create a settings area with:

ACCOUNT

- Display name
- Email
- Profile image
- Connected login provider
- Sign out

SECURITY

- Two-factor authentication
- Authenticator app
- Recovery codes
- Active sessions
- Sign out other sessions
- Passkeys/WebAuthn (mark as coming soon if not implemented)

VAULT

- Vault lock timeout
- Auto-lock
- Clipboard clearing preferences
- Export vault
- Import vault

DANGER ZONE

- Delete account
- Delete vault

Do not make destructive actions easy to trigger accidentally.

==================================================
AUTHENTICATION
==================================================

Create the following unauthenticated screens:

/login
/signup if required by the authentication architecture
/verify
/setup-2fa
/recovery

Primary authentication options:

"Continue with Google"
"Continue with Microsoft"

Use recognizable provider buttons, but keep the design consistent with Keynest.

Do not ask the user to create a traditional Keynest password unless the architecture later requires one.

After OAuth authentication, the user should be taken through first-time setup if necessary.

==================================================
FIRST-TIME USER FLOW
==================================================

Design an onboarding flow.

Step 1:
Welcome to Keynest

Step 2:
Explain the vault security model in simple language.

Example:

"Your vault is encrypted before it is synced. Keynest stores encrypted vault data, not your readable passwords."

Do not make exaggerated security claims.

Step 3:
Set up account security.

Offer:

- Authenticator app
- Recovery codes
- Passkey (if available)

Step 4:
Create first vault item.

Allow:

- Add Login
- Generate Password
- Skip

Then take the user to /vault.

==================================================
VAULT LOCK EXPERIENCE
==================================================

Design a locked-vault screen.

Example:

"Your vault is locked."

Explain:
"Unlock your vault to access your saved passwords and secure notes."

Provide the appropriate unlock action based on the eventual client-side encryption architecture.

Include:

- Unlock
- Lock immediately
- Sign out

The design must make it visually obvious that the account can be authenticated while the encrypted vault remains locked.

==================================================
2FA / SECURITY UX
==================================================

Create polished security screens for:

Enable 2FA:

1. Explain why 2FA matters.
2. Display QR-code placeholder.
3. Show manual setup key.
4. Enter verification code.
5. Confirm enabled.
6. Display recovery codes.

Recovery codes:

- Explain that they should be stored somewhere safe.
- Allow copy.
- Allow download.
- Require confirmation before leaving if codes haven't been acknowledged.

Do not display real secrets in the demo.

==================================================
ITEM TYPES
==================================================

Design reusable UI architecture so more item types can be added later.

Current:

- Login
- Secure Note

Future:

- Credit Card
- Identity
- API Key
- Wi-Fi Password
- SSH Key

Do not implement all future types now. The architecture should make them easy to add later.

==================================================
DESIGN SYSTEM
==================================================

Create a cohesive design system for Keynest.

Visual direction:

- Minimal
- Modern
- Premium but approachable
- Security-focused
- Lots of whitespace
- Strong typography
- Subtle borders
- Restrained use of color
- Avoid excessive gradients
- Avoid generic AI SaaS aesthetics

Important UI components:

- Sidebar
- Top navigation
- Search
- Command palette
- Vault item card/list row
- Password field
- Copy button
- Password strength indicator
- Generator controls
- Modal/dialog
- Dropdown
- Toast notifications
- Confirmation dialogs
- Empty states
- Loading states
- Error states
- Locked vault state

Use consistent icons.

==================================================
RESPONSIVE DESIGN
==================================================

Desktop:

- Persistent sidebar
- Main content area
- Optional detail panel

Tablet:

- Collapsible sidebar

Mobile:

- Bottom navigation or drawer
- Large touch targets
- Search easily accessible
- Item details optimized for mobile
- Password copying should be extremely easy

==================================================
STATES
==================================================

For every major screen, design:

1. Loading state
2. Empty state
3. Populated state
4. Error state
5. Locked state where applicable

Do not only design the happy path.

==================================================
IMPORTANT UX PRINCIPLES
==================================================

The most common actions should require minimal interaction.

Typical flow:

Open Keynest
→ Search
→ Find credential
→ Reveal password
→ Copy
→ Done

Adding a credential:

Add
→ Login
→ Enter URL
→ Generate password
→ Save

Do not make users navigate through unnecessary pages.

Use modals/drawers where they make sense instead of creating a separate route for every small interaction.

==================================================
DELIVERABLE
==================================================

Create the frontend structure for the entire application.

I want:

1. Application shell
2. Routing structure
3. Sidebar/navigation
4. Vault page
5. Search/command palette
6. Login item list
7. Login detail/edit UI
8. Secure notes
9. Password generator
10. Favorites
11. Settings
12. Security/2FA setup
13. Authentication screens
14. First-time onboarding
15. Locked vault screen
16. Empty/loading/error states
17. Responsive mobile layouts
18. Reusable component structure

Use realistic sample data for the UI.

Do not implement actual authentication or cryptography.

The resulting design should feel like a real product that could be taken into development, not a landing-page mockup.
