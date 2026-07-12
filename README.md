# 🚀 PortfolioForge — Multi-User Portfolio Builder SaaS

A production-ready, multi-user Portfolio Builder platform. Your **own portfolio lives at the root domain (`/`)**. Every other user gets a unique `/username` URL. Includes an 8-theme live preview engine, full CRUD dashboard, and admin moderation tools.

---

## 🌐 Routing Overview (important)

| URL                | Shows                                                          |
|---------------------|----------------------------------------------------------------|
| `/`                  | **Your own portfolio** (the account whose username = `OWNER_USERNAME` in backend `.env`) |
| `/builder`           | SaaS marketing/landing page ("Build your own portfolio") |
| `/themes`            | Public theme gallery with live preview |
| `/explore`           | Browse other published portfolios |
| `/pricing`           | Pricing page |
| `/features`          | Features page |
| `/login`, `/register`| Auth |
| `/dashboard/*`       | Authenticated content management |
| `/:username`         | Any user's published portfolio (e.g. `/johnsmith`) |

This means visiting `yourdomain.com` shows **your** portfolio directly — exactly like a normal personal site — while the full SaaS product (signup, theme gallery, other users' portfolios) lives at `/builder` and `/:username`.

To make this work, set in `backend/.env`:
```env
OWNER_USERNAME=yourusername
```
Then register an account with that exact username (or run `npm run seed`, which creates one for you) and publish your portfolio. The root path will render it via the theme you've selected.

If `OWNER_USERNAME` isn't set yet or that portfolio doesn't exist, `/` gracefully falls back to a small "not set up yet" screen with links to sign in or visit the builder — it never crashes.

---

## 🎨 Theme Engine — 8 Fully Distinct Layouts

All theme code lives in `frontend/src/pages/portfolio/themes/`, registered centrally in `frontend/src/themes/index.js` and described in `frontend/src/themes/themeConfig.js` (single source of truth for names, descriptions, preview swatches, and tags).

| Theme ID                | Name                  | Vibe |
|--------------------------|-----------------------|------|
| `modern-saas`            | Modern SaaS           | Clean dark cards, gradient glows, professional |
| `developer-terminal`     | Developer Terminal    | Hacker green, monospace, typing animation, CLI metaphors |
| `creative-designer`      | Creative Designer     | Bold brutalist type, hard shadows, asymmetric grid |
| `minimal-professional`   | Minimal Professional  | Serif typography, generous whitespace, editorial |
| `futuristic-ai`          | Futuristic AI         | Neon cyan on near-black, grid background, glow rings |
| `startup-founder`        | Startup Founder       | Orange energy, pill buttons, pitch-deck feel |
| `glassmorphism`          | Glassmorphism         | Frosted blur cards, aurora gradient backdrop |
| `premium-dark`           | Premium Dark          | Gold on black, serif, luxury editorial spacing |

Each theme component receives the **same data shape** (`{ portfolio, user, projects, skills, experience, education, certificates }`) and an `accent` color — so switching themes never touches your content, and adding a 9th theme is just: write a new component, add one line to `themeConfig.js` and `themes/index.js`.

### Theme preview features
- **`/themes`** — public gallery, sample data, live preview modal with Desktop / Tablet / Mobile width toggles + fullscreen
- **`/dashboard/themes`** — same gallery scoped to your real saved data; one click to apply
- Switching themes is a single `PATCH /api/portfolio { theme: 'developer-terminal' }` — instant, non-destructive

---

## 📁 Project Structure

```
portfolio-saas/
├── backend/
│   ├── config/cloudinary.js
│   ├── controllers/
│   │   ├── authController.js       # register/login now require + validate username
│   │   ├── portfolioController.js
│   │   ├── crudController.js       # generic factory: projects/skills/experience/education/certificates
│   │   ├── adminController.js
│   │   └── publicController.js     # getPublicPortfolio (by username) + getOwnerPortfolio (for "/")
│   ├── middleware/{authMiddleware,errorMiddleware}.js
│   ├── models/
│   │   ├── User.js                 # + username (unique, indexed)
│   │   ├── Portfolio.js            # theme enum (8 values), sections[], tagline, coverImage
│   │   ├── Project.js
│   │   └── SubModels.js            # Skill, Experience, Education, Certificate
│   ├── routes/{auth,portfolio,projects,skills,experience,education,certificates,users,admin,public,upload}.js
│   ├── utils/seed.js               # creates OWNER_USERNAME admin account
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── themes/
    │   │   ├── themeConfig.js      # 8 theme metadata (name, description, swatch colors, tags)
    │   │   └── index.js            # THEME_COMPONENTS registry + getThemeComponent()
    │   ├── pages/
    │   │   ├── BuilderHomePage.js  # SaaS marketing home (was LandingPage, now at /builder)
    │   │   ├── ThemeGalleryPage.js # /themes — live preview, device switcher, fullscreen
    │   │   ├── ExplorePage.js      # /explore — browse portfolios (was SearchPage)
    │   │   ├── PricingPage.js
    │   │   ├── FeaturesPage.js
    │   │   ├── LoginPage.js        # + RegisterPage with live username availability check
    │   │   ├── portfolio/
    │   │   │   ├── OwnerPortfolioPage.js   # renders at "/" — fetches /api/public/owner
    │   │   │   ├── PublicPortfolioPage.js  # renders at "/:username"
    │   │   │   └── themes/                 # 8 theme components, ~same data contract
    │   │   │       ├── ModernSaas.js
    │   │   │       ├── DeveloperTerminal.js
    │   │   │       ├── CreativeDesigner.js
    │   │   │       ├── MinimalProfessional.js
    │   │   │       ├── FuturisticAI.js
    │   │   │       ├── StartupFounder.js
    │   │   │       ├── Glassmorphism.js
    │   │   │       └── PremiumDark.js
    │   │   └── admin/
    │   │       ├── DashboardLayout.js      # + "Themes" nav item
    │   │       ├── DashboardHome.js
    │   │       ├── ProfilePage.js          # + tagline, username display (read-only)
    │   │       ├── ProjectsPage.js / SkillsPage.js / ExperiencePage.js / EducationPage.js / CertificatesPage.js
    │   │       ├── DashboardThemesPage.js  # apply themes against your real data
    │   │       ├── SettingsPage.js         # publish toggle, accent color, SEO, password
    │   │       ├── AdminUsersPage.js / AdminPortfoliosPage.js
    │   ├── context/AuthContext.js          # register(name, username, email, password)
    │   ├── services/api.js                 # + checkUsername, getOwnerPortfolio
    │   └── App.js                          # "/" → OwnerPortfolioPage, "/builder" → SaaS home
    └── tailwind.config.js
```

---

## 🗄️ Database Schema (updated)

### User
```
name, username (unique, indexed, [a-z0-9_-]{3,30}), email, password (hashed),
role (user|admin), avatar, isActive, lastLogin
```

### Portfolio
```
user (ref), fullName, tagline, title, bio, profilePicture, coverImage, resumeUrl,
contact { email, phone, location, website },
socialLinks { github, linkedin, twitter, instagram, youtube, portfolio },
isPublished, theme (enum: 8 values), accentColor,
sections[] (ordering — hero/about/skills/projects/experience/education/certificates/contact),
seoTitle, seoDescription, views
```

> Note: the old `slug` field is gone. Public identity is now the **User.username**, which is permanent, unique, and set at registration — exactly matching the spec ("Display names can be duplicated, usernames cannot").

Project / Skill / Experience / Education / Certificate schemas are unchanged from the original build.

---

## 🔌 API Changes

| Method | Route                          | Change |
|--------|--------------------------------|--------|
| POST   | `/api/auth/register`           | now requires `username` too; validates format & uniqueness |
| GET    | `/api/auth/check-username/:u`  | **new** — live availability check used by the register form |
| GET    | `/api/public/:username`        | was `/api/public/:slug` — now keyed by username |
| GET    | `/api/public/owner`            | **new** — powers the `/` route; reads `OWNER_USERNAME` env var |
| GET    | `/api/portfolio/stats`         | now also returns `username` and `theme` |

All other routes (`projects`, `skills`, `experience`, `education`, `certificates`, `admin/*`, `upload/*`) are unchanged.

---

## 🚀 Getting Started

### 1. Install
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Backend `.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/portfolio_saas
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000

# Whoever owns this username is shown at "/"
OWNER_USERNAME=yourusername
```

### 3. Configure Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Seed your owner account
```bash
cd backend
npm run seed
# Creates: <OWNER_USERNAME> / admin@portfolio.dev / Admin@123, already published
```

### 5. Run
```bash
# Terminal 1
cd backend && npm run dev
# Terminal 2
cd frontend && npm start
```

Visit `http://localhost:3000` → **your portfolio** renders immediately (seed data is empty, so fill it in from `/dashboard` after logging in with the seeded credentials).

Visit `http://localhost:3000/builder` → the SaaS landing page for new sign-ups.

---

## 👤 Multi-User Isolation

- Every authenticated route scopes queries by `req.user._id` — no user can read/write another user's projects, skills, experience, education, or certificates.
- Usernames are globally unique and validated both client-side (live check while typing) and server-side (race-condition-safe via Mongo's unique index + a pre-check).
- Admins can deactivate or delete any non-admin user, which cascades across all 6 collections.

---

## 🔒 Security Features
- JWT auth (30-day expiry), bcrypt (12 rounds)
- Rate limiting: 100 req/15 min global, 10 req/15 min on auth routes
- Helmet security headers, CORS scoped to `FRONTEND_URL`
- Admin routes double-guarded (middleware + role check)

---

## 📝 License
MIT — free to use and modify.

---

## 🎭 Admin-Controlled Theme Catalog (RBAC)

A two-tier system separates **what themes exist in code** from **what's offered to users**:

| Tier | Lives in | Controlled by |
|---|---|---|
| Component registry | `frontend/src/themes/index.js` + `backend/config/implementedThemeKeys.js` | Developers (code deploy) |
| Live catalog | MongoDB `Theme` collection | Admins (no deploy needed) |

### What admins can do (UI: `/dashboard/admin/themes`, API: `/api/admin/themes/*`)
- Add an implemented theme to the live catalog
- Edit its display name, description, accent swatch, order
- Enable/disable it (disabling the current default is blocked)
- Delete it from the catalog (deleting the current default is blocked)
- Set it as the platform default

### What normal users can do (UI: theme bar after the navbar + `/dashboard/themes`, API: `GET /api/themes`, `PUT /api/portfolio/theme`)
- See only **enabled** catalog entries
- Switch their own portfolio's theme to any enabled entry
- Cannot create/edit/delete/default — those endpoints require `protect + admin` middleware and return `403` for non-admin tokens, regardless of frontend state

### Enforcement points (defense in depth)
1. **Route guard**: `router.use(protect, admin)` on every mutating theme route (`backend/routes/adminThemes.js`)
2. **Schema**: `Portfolio.theme` has no enum — validity is checked live against the `Theme` catalog in `updateMyTheme`, not hardcoded, so a direct API call with an arbitrary string is rejected
3. **Isolation**: `updateMyTheme` scopes its update to `{ user: req.user._id }` — structurally impossible to affect another user's document
4. **Frontend route guard**: `/dashboard/admin/themes` wrapped in `<ProtectedRoute adminOnly>` (redirects non-admins)
5. **Frontend UI gating**: the "Manage Themes" link and sidebar nav item only render when `isAdmin` is true

### New-user default theme flow
On registration, `authController.register` looks up `Theme.findOne({ isDefault: true })` and stores that key directly on the new `Portfolio` document — no extra runtime lookup needed later. If admin changes the default afterward, existing users keep whatever they already had; only brand-new signups pick up the new default.

---

## 💳 Payments & Premium Themes

### Plans
| Plan | Price | Unlocks |
|---|---|---|
| Free | $0 | All 8 standard themes |
| Pro | $9/mo (Stripe subscription) | + **Executive Suite** and **Neon Cyber Pro** — 2 exclusive themes |

### How it works
- `User.plan` (`'free' \| 'pro'`) is the single source of truth, stored in MongoDB
- `Theme.isPremium` marks which catalog entries require Pro
- The real enforcement is server-side in `portfolioController.updateMyTheme`: a free-plan user selecting a premium theme key gets `402 Payment Required`, regardless of what the frontend shows or whether the request came from the UI, curl, or a modified frontend build
- The frontend shows premium themes to everyone (with a lock + "Pro" badge) for upsell, but only lets Pro users actually apply them — locked cards link to `/pricing` instead

### Stripe integration (`backend/controllers/billingController.js`)
- `POST /api/billing/create-checkout-session` — creates a Stripe Checkout subscription session, redirects to Stripe
- `POST /api/billing/create-portal-session` — opens the Stripe Customer Portal so Pro users can manage/cancel
- `GET /api/billing/verify-session?session_id=...` — synchronous confirmation read on the `/billing/success` redirect page (doesn't make the UI wait on webhook delivery)
- `POST /api/billing/webhook` — the actual source of truth for subscription state (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`). Mounted in `server.js` **before** `express.json()` with `express.raw()`, since Stripe signature verification needs the exact raw body bytes.

### Setting up real Stripe billing
1. Create a Stripe account, get your secret key
2. Create a **Product** with a recurring **Price** (e.g. $9/month) → copy its Price ID
3. Set in `backend/.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PRICE_ID_PRO=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...   # from `stripe listen` or your webhook endpoint settings
   ```
4. For local testing, run `stripe listen --forward-to localhost:5000/api/billing/webhook`

### Developing without Stripe keys
Every billing endpoint checks `isConfigured()` first and returns a clear `503` instead of crashing if keys are missing. For local development and demos, two routes exist purely for testing and **404 automatically when `NODE_ENV=production`**:
```
POST /api/billing/dev-upgrade     # flips your account to Pro, no Stripe involved
POST /api/billing/dev-downgrade   # flips back to Free
```
The Pricing page and Settings page both surface a "Dev: Simulate Upgrade" button automatically when they detect billing isn't configured, so premium themes are fully testable out of the box.

### Adding a 3rd premium theme later
Same two-step process as any theme: ship the component + register it in `frontend/src/themes/index.js` and `backend/config/implementedThemeKeys.js` with `isPremium: true`, then an admin adds it to the live catalog from `/dashboard/admin/themes` with the Premium toggle checked.

---

## 🏛️ Role Hierarchy (super_admin / admin / family_admin / user)

### Design decision: premium is an entitlement, not a role
`User.role` answers *"what can this account administratively do?"*. It does
**not** encode free-vs-premium — that's billing state, derived fresh on
every check via `backend/utils/entitlements.js`:

```js
isPremiumEntitled(user) =
  isAdminRole(user)                    // admin / super_admin — always true
  || user.plan === 'pro'               // paid via Stripe
  || user.familyAccess?.isPremiumGranted  // granted by a family_admin
```
One function, one place. A Stripe webhook firing never touches `role`; a
family_admin granting access never touches `plan`. Both just flow into the
same boolean everything else reads.

### Roles
| Role | Created via | Scope |
|---|---|---|
| `super_admin` | Seed script only — no API can create or remove one | Everything. Untouchable by any other role. |
| `admin` | `PUT /api/admin/users/:id/promote` (super_admin only) | Full platform management — themes, users, family groups, portfolios. Cannot touch other admins or super_admin. |
| `family_admin` | `POST /api/admin/family-groups` (admin or super_admin) — auto-promotes the target user | Their own family group only: invite/remove members, grant/revoke premium, view usage. |
| `user` | Default on registration | Free or premium *(entitlement, not role)* — selects from the admin-curated theme catalog. |

### Backend enforcement (every check is server-side, never just hidden in the UI)
- `backend/middleware/authMiddleware.js` — `authorize(...roles)` factory. `admin` now means "admin OR super_admin" everywhere it's already used, so existing admin-gated routes automatically extend to super_admin with no route file changes. `superAdmin` and `familyAdmin` are new, chainable the same way.
- `backend/controllers/familyController.js` — every mutating action calls `assertCanManageGroup(group, req.user, res)`: a `family_admin` passes only for their own group (`group.owner === req.user._id`); `admin`/`super_admin` pass for any group. This check is inline because it depends on the resource, not just the role — same pattern as `portfolioController`'s `{ user: req.user._id }` scoping.
- `backend/controllers/adminController.js` — `deleteUser`/`toggleUserStatus` block touching `super_admin` entirely, and block touching `admin` unless the acting user is `super_admin`.
- `backend/controllers/billingController.js` — `createCheckoutSession` refuses admin-tier accounts before even checking Stripe config: *"Admin accounts already have full access and do not need to subscribe."*
- `backend/controllers/portfolioController.js` — the premium theme gate calls `isPremiumEntitled(req.user)` instead of checking `plan` directly, so admin bypass and family grants both unlock automatically with no extra conditionals.

### Frontend (compatibility note)
`isAdmin` in `AuthContext` was broadened from `role === 'admin'` to `['admin','super_admin'].includes(role)` — **this was a required fix, not a cosmetic one**: without it, the seeded `super_admin` owner account would have been locked out of the Theme Manager and every other existing admin-only page, since those all gate on `isAdmin`. New, separate flags (`isSuperAdmin`, `isFamilyAdmin`) drive the new tier-specific nav sections and routes without touching any existing `isAdmin` check.

### New pages
- `/dashboard/admin/family-groups` (admin-tier) — oversight of every family group, create new ones
- `/dashboard/super-admin/admins` (super_admin only) — promote/demote admins
- `/dashboard/family` (family_admin only) — their own group: invite, remove, grant/revoke premium. Contains **zero** theme or platform-admin code — rule 6 is satisfied by what this page doesn't import, not by a hidden button.

### Database
- `User.role` enum: `['user', 'family_admin', 'admin', 'super_admin']`
- `User.familyAccess { groupId, grantedBy, isPremiumGranted, grantedAt }` — denormalized cache of a family grant, kept in sync with `FamilyGroup.members[]` by `familyController` on every grant/revoke/remove
- `FamilyGroup { name, owner (unique, one group per family_admin), maxMembers, members[] }` — the source-of-truth ledger

---

## 🔑 Forgot / Reset Password

### Flow
1. User clicks **"Forgot password?"** on `/login` → lands on `/forgot-password`
2. Submits their email → `POST /api/auth/forgot-password`
3. Backend **always** returns the same generic message (`"If an account exists for that email, a password reset link has been sent."`) whether or not the email is registered — this response object is the actual privacy control for rule 8, not a UI choice
4. If the email exists: a raw 32-byte token is generated, its **SHA-256 hash** (never the raw value) plus a 20-minute expiry are saved on the user, and an email is sent with a link to `{FRONTEND_URL}/reset-password/{rawToken}`
5. User opens the link → `/reset-password/:token` reads the token from the URL, never submits it anywhere except the final reset call
6. Submits a new password (with client-side confirm-match check) → `PUT /api/auth/reset-password/:token`
7. Backend re-hashes the incoming raw token, looks up a user whose `resetPasswordToken` matches AND whose `resetPasswordExpire` is still in the future, sets the new password (re-hashed by the existing `pre('save')` hook), and clears both reset fields — the token is single-use by construction, since the lookup can never succeed again once those fields are cleared

### Why only the hash is stored
If the database were ever read (backup leak, injection, anything), a stored raw token would let an attacker reset any password whose link they could find. Storing only `sha256(token)` means the database alone is useless for that — you'd need the raw token from the actual email, which only the recipient has. This is the same reasoning `bcrypt` already gets applied to the password field; reset tokens get the equivalent treatment via `crypto`.

### Email sending — graceful when unconfigured
`backend/config/email.js` + `backend/utils/sendEmail.js` follow the **exact same lazy pattern** as `config/stripe.js`: if `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` aren't set, `sendEmail` logs the would-be email (including the reset link) to the **server console** instead of crashing — never to the HTTP response, which is what keeps the "don't reveal whether an email exists" guarantee true even with email turned off in local dev.

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="PortfolioForge <no-reply@portfolioforge.dev>"
```
Works with Gmail SMTP (use an App Password, not your real password), SendGrid, Mailgun, AWS SES, or any standard SMTP provider — just fill in host/port/user/pass.

### Rate limiting (already covered, no new wiring needed)
`/api/auth/forgot-password` and `/api/auth/reset-password/:token` sit under the same `authLimiter` (10 requests / 15 min) already applied to the whole `/api/auth` router in `server.js` — this is exactly the right guard against both inbox-spamming and token-guessing, and required zero changes to get.

### Files touched
| File | Change |
|---|---|
| `backend/models/User.js` | `resetPasswordToken`/`resetPasswordExpire` (`select:false`), `getResetPasswordToken()` method, `toJSON` hardened to strip them defensively |
| `backend/config/email.js` | **new** — lazy Nodemailer transporter |
| `backend/utils/sendEmail.js` | **new** — send-or-log helper |
| `backend/controllers/authController.js` | `forgotPassword`, `resetPassword`, inline HTML email template |
| `backend/routes/auth.js` | `POST /forgot-password`, `PUT /reset-password/:token` |
| `backend/package.json` | `+nodemailer` |
| `frontend/src/services/api.js` | `authAPI.forgotPassword`, `authAPI.resetPassword` (confirm-match checked client-side before the network call) |
| `frontend/src/pages/LoginPage.js` | "Forgot password?" link; `ForgotPasswordPage` and `ResetPasswordPage` components added (same file, same convention as the existing `RegisterPage`) |
| `frontend/src/pages/ForgotPasswordPage.js`, `ResetPasswordPage.js` | **new** — thin re-exports, identical pattern to the existing `RegisterPage.js` |
| `frontend/src/App.js` | `/forgot-password`, `/reset-password/:token` routes, wrapped in the existing `PublicOnlyRoute` |

---

## 📄 Resume Viewing — Final Fix (proxy removed, direct Cloudinary link)

### The journey, briefly, and why it ends here
Three iterations were tried on this: (1) fixing `resource_type` from `image` to `raw`, (2) a backend proxy with a signed-URL retry, (3) Cloudinary's `private` delivery type with on-demand signed downloads. Each added more server-side Cloudinary-signing complexity that couldn't be verified without live access to the account, and **(3) still produced the same 401** the user reported. That's the signal to stop adding unverifiable cleverness and simplify instead of patching further.

### The fix: no proxy, no signing — just the plain `secure_url`
- `backend/config/cloudinary.js` — resumes still upload as `resource_type: 'raw'` with a `.pdf`-suffixed `public_id` (this part was always correct — PDFs should never go through Cloudinary's `image` pipeline). The `type: 'private'` delivery type from the previous round is **removed** — resumes upload with Cloudinary's plain default `type: 'upload'`, producing a directly-fetchable `secure_url` with nothing to regenerate or sign on every view.
- **Removed entirely**: `backend/utils/streamRemoteFile.js`, `backend/utils/resolveResumeUrl.js`, the `GET /api/portfolio/resume` route, the `GET /api/public/:username/resume` and `GET /api/public/owner/resume` routes, and the `resumePublicId` field on `Portfolio`. None of this is needed — `resumeUrl` was already part of the portfolio data every page fetches; there was never a reason for a dedicated endpoint.
- `frontend/src/pages/admin/ProfilePage.js` — "View Resume" is a plain `<a href={data.resumeUrl} target="_blank">` again. No blob fetch, no axios, no auth dance (a Cloudinary delivery URL doesn't need *our* backend's auth to be fetched — it's either publicly fetchable by Cloudinary's own rules or it isn't, regardless of whether the visitor is logged into this app).
- `frontend/src/pages/portfolio/OwnerPortfolioPage.js` / `PublicPortfolioPage.js` — `resumeViewUrl` is now just `data.portfolio?.resumeUrl || null` instead of a constructed proxy URL.

### Why the 13 theme files needed zero changes
`frontend/src/themes/getResumeLink.js` was built specifically so every theme reads one field (`data.resumeViewUrl`) instead of knowing anything about *how* that URL is produced. Swapping the proxy out for a direct link was a **2-file change** (the two page wrappers above) instead of a 13-file one — that's the entire point of the abstraction, and it held up exactly as intended across three rounds of backend churn. Confirmed via `grep -l getResumeLink *.js | wc -l` → `13/13`, every time.

### If `resumeUrl` itself still 401s when opened directly
At that point it's not a code bug — no backend logic can make Cloudinary serve a file type its account-level policy blocks for plain public links. The fix is a one-time setting change: **Cloudinary dashboard → Settings → Security → "Allow delivery of PDF and ZIP files" → ON.** This is now directly testable: re-upload a resume (to get a fresh `raw`-type URL) and open it — any failure shows Cloudinary's own error directly, with no proxy or signing layer of ours in between to obscure what's actually happening.

---

## 💸 UPI Payment Option

A manual, gateway-free alternative to the existing Stripe flow — exactly what was asked for ("Do not require external paid payment gateway integration unless absolutely necessary").

### How "supporting Paytm / Google Pay / PhonePe" actually works
There's no separate per-app API to integrate — UPI deep-linking is app-agnostic by design. A single `upi://pay?pa=...&pn=...&am=...` link is handled by *every* UPI app installed on the device (Android shows a picker, or opens the only one installed). The component additionally offers `tez://upi/pay` (Google Pay), `phonepe://pay`, and `paytmmp://pay` as convenience buttons for browsers/WebViews where the generic intent doesn't reliably trigger a picker — same underlying payment, just an explicit app choice.

### New files
| File | Purpose |
|---|---|
| `backend/models/PaymentConfig.js` | Singleton platform config: `upiId`, `payeeName`, `qrCodeUrl`, `note`, `isEnabled` |
| `backend/models/PaymentVerification.js` | A user's "I paid via UPI" claim — `utr`, `note`, `status` (pending/approved/rejected) |
| `backend/controllers/paymentController.js` | Public config read, user claim submission, admin config + review management |
| `backend/routes/payment.js` | `GET /api/payment/config` (public), `POST /api/payment/verify` (protect) |
| `backend/routes/adminPayment.js` | `GET/PUT /api/admin/payment/config`, `GET /api/admin/payment/verifications`, `PUT .../approve`, `PUT .../reject` — all `protect + admin` |
| `frontend/src/components/shared/UpiPaymentCard.js` | Reusable widget — QR (admin-uploaded or auto-generated via a free public QR service, no API key, no payment gateway), UPI ID + copy, Pay Now + app-specific buttons (mobile), UTR submission form |
| `frontend/src/pages/admin/AdminPaymentVerificationsPage.js` | Admin review queue — approve flips `user.plan` to `'pro'` directly, no Stripe involved |

### Where it's configured
- **Admin**: `SettingsPage.js` → new "UPI Payment Settings" card (enable toggle, UPI ID, payee name, note, optional QR upload reusing the existing image-upload endpoint) — visible only to `isAdmin`
- **Stored**: MongoDB (`PaymentConfig` singleton) — not environment variables, so admins can change it without a redeploy
- **Shown to users**: `PricingPage.js`, below the existing Stripe plan grid, only when `upiConfig.isEnabled` and the user isn't already Pro

### Manual verification flow (no webhook needed)
1. User pays via UPI (any app) using the shown ID/QR
2. User optionally submits their UTR on the same page → `PaymentVerification` record, `status: 'pending'`
3. Admin reviews at `/dashboard/admin/payment-verifications`, clicks Approve → `user.plan = 'pro'` directly (separate, much simpler code path from Stripe's `applyProUpgrade`, since there's no customer/subscription object to track for a one-time manual transfer)

### Admin bypass still holds
`submitVerification` explicitly blocks admin-tier accounts from submitting (`bypassesBilling(req.user)` check) — consistent with the existing rule that admins never need to pay for anything, enforced the same way it already is for Stripe checkout.

### "Not working / not visible" — what was actually wrong
Thorough re-inspection of every UPI file (`paymentController.js`, both route files, `server.js`'s mount order, the model, `UpiPaymentCard.js`, both pages) found **no logic bugs** — the routes are mounted correctly, the rendering conditions are correct per the explicit requirement ("hide unless disabled or missing required fields"), and the Toggle component's `onChange` wiring is correct.

The actual bug: `PricingPage.js`'s config fetch used `.catch(() => {})` — any real failure (network, a typo'd route, anything) looked **identical** to "UPI just isn't configured," with zero way to tell the difference. Fixed to log the real error via `console.error` while still failing safe (hidden, not broken) on the UI side. `paymentController.js` also gained explicit logging on every config read/write, stating plainly when a document doesn't exist yet, when it's disabled, or when it's enabled but missing a UPI ID — so "is this actually showing right now" is answerable from server logs, not guesswork.

`SettingsPage.js`'s admin card now shows a live, self-diagnosing status line — "✓ Live" with a one-click Pricing preview link when both `isEnabled` and `upiId` are set, an explicit orange warning when enabled-but-empty, or a plain "Disabled" state — removing any need to guess whether a save actually took effect.
