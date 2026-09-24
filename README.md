# Civil At Hand — Complete Engineering Handoff README

> **Document type:** Full project handoff / technical master README  
> **Project:** Civil At Hand  
> **Production domain configured in source:** `https://civilathan.in`  
> **Application type:** Full-stack engineering consultancy, content, education, customer portal, payment, vendor, and administration platform  
> **Framework:** Next.js App Router + React + TypeScript  
> **Purpose of this document:** Give a new developer enough architectural, functional, security, data, deployment, UX, SEO, and maintenance context to understand the project before opening individual source files.

---

# TABLE OF CONTENTS

1. Project identity
2. What the product actually is
3. Product areas
4. Architecture at a glance
5. Technology stack
6. Runtime model
7. Repository structure
8. Naming conventions
9. Application configuration
10. Global application shell
11. Routing architecture
12. Public route map
13. Customer route map
14. Admin/private route map
15. API architecture
16. Complete API inventory
17. Frontend state architecture
18. Domain models
19. Authentication architecture
20. Customer verification model
21. Admin authentication
22. Admin authorization
23. MongoDB architecture
24. Database/collection strategy
25. Payment architecture
26. Payment lifecycle
27. Payment idempotency
28. Payment entitlement rules
29. Vendor payment flow
30. Education architecture
31. Study-material storage
32. Upload architecture
33. Content management/blog architecture
34. HTML sanitization/security
35. Analytics
36. Notifications
37. Support/ticketing
38. Project/drawing workflow
39. Invoice workflow
40. Proposal workflow
41. Vendor workflow
42. Career/work-with-us workflow
43. Portfolio workflow
44. Services architecture
45. Engineering calculators
46. Engineering disclaimer
47. SEO architecture
48. Content-quality/AdSense strategy
49. PWA/service worker
50. Caching rules
51. Security headers
52. Accessibility
53. Design system
54. Responsive/mobile rules
55. Performance rules
56. Environment variables
57. Local development
58. Production deployment
59. Database operations
60. Payment testing
61. Authentication testing
62. Admin testing
63. API testing
64. SEO testing
65. PWA testing
66. Common failures
67. Debugging methodology
68. Feature development methodology
69. Migration methodology
70. Do-not-break rules
71. New developer onboarding
72. Final acceptance checklist
73. Master mental model

---

# 1. PROJECT IDENTITY

## 1.1 Product name

**Civil At Hand**

## 1.2 Legal/business identity represented in the application

**Civil At Hand — Design & Consultancy**

## 1.3 Core positioning

**Complete Civil Engineering Design & Consultancy**

## 1.4 Current region configuration

```text
Region: Haryana
Country: India
Area served: India
Founding year: 2024
```

## 1.5 Main production domain

```text
https://civilathan.in
```

## 1.6 Primary business email configured in the project

```text
info.civilathand@zohomail.in
```

The central source for these business values is:

```text
src/data/site.ts
```

---

# 2. WHAT THE PRODUCT ACTUALLY IS

Civil At Hand is a multi-domain application.

It should be understood as the combination of:

```text
A. Public consultancy website
B. Engineering tools platform
C. Content/SEO platform
D. Education platform
E. Customer portal
F. Project management portal
G. Payment/entitlement system
H. Vendor platform
I. Support system
J. Admin operating system
K. PWA/offline web application
```

This distinction is important.

A developer who treats the project as only a marketing website can accidentally break:

- authentication
- payments
- private data
- admin permissions
- database access
- customer project workflows
- PWA behavior

---

# 3. PRODUCT AREAS

## 3.1 Public website

```text
Home
About
Services
Portfolio
Gallery
Blog
Contact
FAQ
Talk
Vendors
Work With Us
Legal/policy pages
```

## 3.2 Engineering tools

```text
Concrete calculator
Engineering calculators
Engineering unit converter
Concrete conversions
Calculator API
```

## 3.3 Education

```text
Education hub
Courses
Course detail
Enrollments
Study materials
Study-material downloads
Mentorship
Mentorship applications
```

## 3.4 Customer portal

```text
Authentication
Profile
Dashboard
Projects
Drawings
Invoices
Proposals
Tickets
Notifications
Payment activity
Purchases
```

## 3.5 Administration

```text
Admin authentication
Custom admins
Permissions
Clients
Users
Leads
Projects
Drawings
Invoices
Payments
Offers
Coupons
Blogs
Portfolio
Services
Mentorship
Courses
Study materials
Careers
Team
Vendors
Vendor leads
Tickets
Public chat
Analytics
Activity logs
```

---

# 4. ARCHITECTURE AT A GLANCE

```text
                              USER BROWSER
                                   |
              +--------------------+--------------------+
              |                    |                    |
           PUBLIC              CUSTOMER              ADMIN
              |                    |                    |
       SEO/content/tools      Firebase Auth        Admin Session
       services/blog         Dashboard             Permissions
       education             Projects              Control Center
       portfolio             Drawings              Analytics
       calculators           Invoices              Payments
              |                    |                    |
              +--------------------+--------------------+
                                   |
                              NEXT.JS APP
                                   |
              +--------------------+--------------------+
              |                                         |
       React/Next UI                              API Route Handlers
              |                                         |
       Client state                       +-------------+-------------+
              |                           |             |             |
              |                        MongoDB       Firebase      Razorpay
              |                           |             |             |
              |                     business data   identity      payment
              |                     permissions     verify       webhooks
              |
              +--> Service Worker
              +--> SEO / Metadata
              +--> Structured Data
              +--> Analytics
              +--> Browser APIs
```

---

# 5. TECHNOLOGY STACK

| Area | Technology |
|---|---|
| Framework | Next.js `^16.3.0` |
| Router | Next.js App Router |
| UI library | React `19.2.4` |
| Language | TypeScript |
| CSS | Tailwind CSS `^4` + custom CSS |
| Animation | Framer Motion `^12.40.0` |
| Icons | Lucide React |
| Database | MongoDB `^7.2.0` |
| Customer identity | Firebase Authentication |
| Admin identity | Custom signed session |
| Payment gateway | Razorpay |
| Email | Nodemailer |
| PDF | jsPDF + AutoTable |
| PWA | Custom Service Worker |
| Linting | ESLint |
| Build | Next.js |
| CSS processing | PostCSS/Tailwind |
| Import alias | `@/*` → `src/*` |

---

# 6. RUNTIME MODEL

The project has three major execution environments.

## Browser

Responsible for:

- rendering UI
- Firebase client authentication
- interactive state
- form submission
- payment checkout initiation
- calculators
- dashboard interactions
- admin UI
- PWA/service-worker registration

## Next.js server

Responsible for:

- server rendering
- route handlers
- authorization
- MongoDB access
- Firebase token verification
- payment verification
- webhook processing
- email
- file access
- PDF generation
- secure business logic

## External systems

```text
MongoDB
Firebase
Razorpay
SMTP provider
Google/Firebase APIs where configured
```

---

# 7. REPOSITORY STRUCTURE

```text
civilathand-v1-main/
│
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tsconfig.json
│
├── public/
│   ├── gallery/
│   ├── icons/
│   ├── profile-avatars/
│   ├── uploads/
│   ├── hero.jpg
│   ├── logo.jpg
│   ├── sustainability.jpg
│   └── sw.js
│
└── src/
    │
    ├── app/
    │   ├── pages
    │   ├── layouts
    │   └── api/
    │
    ├── components/
    │   ├── global
    │   ├── admin
    │   ├── education
    │   ├── payments
    │   ├── chat
    │   └── icons
    │
    ├── context/
    │   └── ProjectContext.tsx
    │
    ├── data/
    │   ├── site.ts
    │   ├── services.ts
    │   ├── portfolio.ts
    │   ├── cities.ts
    │   └── education/
    │
    └── lib/
        ├── auth
        ├── mongodb
        ├── firebase
        ├── payments
        ├── analytics
        ├── uploads
        ├── education
        ├── sanitization
        ├── PDF
        └── business utilities
```

---

# 8. NAMING CONVENTIONS

## Pages

```text
page.tsx
```

## Layouts

```text
layout.tsx
```

## API

```text
route.ts
```

## Dynamic route segments

```text
[id]
[slug]
[course]
[service]
[city]
[conversion]
```

## Components

PascalCase:

```text
AdminView.tsx
ProjectPanel.tsx
PaymentHistoryPanel.tsx
```

## Utility files

Usually camelCase:

```text
paymentAccess.ts
paymentFulfillment.ts
sanitizeHtml.ts
studyMaterials.ts
```

---

# 9. APPLICATION CONFIGURATION

## Central site config

```text
src/data/site.ts
```

This should be treated as the authoritative configuration for:

- name
- legal name
- tagline
- URL
- email
- region
- country
- social profiles
- WhatsApp
- business metadata

Do not create duplicate hard-coded business identity values across many components.

---

# 10. GLOBAL APPLICATION SHELL

The root application is assembled from:

```text
src/app/layout.tsx
```

Important global systems:

```text
Metadata
Structured data
Accessibility layer
Service worker registration
ProjectProvider
AuthGuard
SiteChrome
Analytics page tracking
Global CSS
```

A root-layout change can affect every route.

---

# 11. GLOBAL COMPONENT RESPONSIBILITIES

## `SiteChrome.tsx`

Global visual/site wrapper.

## `Header.tsx`

Primary navigation.

## `Footer.tsx`

Global footer and business navigation.

## `AccessibilityLayer.tsx`

Accessibility enhancements.

## `ServiceWorkerRegister.tsx`

PWA registration/update behavior.

## `AnalyticsPageTracker.tsx`

Page/activity tracking.

## `StructuredData.tsx`

SEO structured data.

## `AuthGuard.tsx`

Client-side authentication experience.

## `ProjectContext.tsx`

Shared application data/state.

---

# 12. ROUTING ARCHITECTURE

Next.js App Router is the only intended routing system.

The routing tree is organized by business domain.

```text
/
├── about
├── contact
├── faq
├── gallery
├── links
├── portfolio
├── services
├── blog
├── education
├── calculators
├── engineering-unit-converter
├── mentorship
├── vendors
├── vendor-register
├── work-with-us
├── auth
├── dashboard
├── profile
├── proposals
├── payment-success
├── private
└── cah-expert-control
```

---

# 13. COMPLETE PUBLIC ROUTE MAP

```text
/
/about
/contact
/faq
/gallery
/links
/portfolio
/portfolio/[id]

/services
/services/all-services
/services/all-services/[slug]
/services/[service]/[city]

/blog
/blog/[slug]

/talk

/vendors
/vendors/[slug]
/vendor-register

/work-with-us
/work-with-us/[slug]

/education
/education/courses
/education/courses/[course]
/education/study-materials
/education/study-materials/[slug]

/mentorship

/calculators
/calculators/concrete
/concrete-calculator

/engineering-unit-converter
/engineering-unit-converter/[conversion]
/engineering-unit-converters/concrete

/privacy-policy
/cookie-policy
/terms-and-conditions
/accessibility-statement
/engineering-disclaimer

/offline
```

---

# 14. CUSTOMER ROUTES

```text
/auth
/forgot-password
/reset-password

/dashboard
/profile
/proposals
/payment-success
/team-onboarding
```

These routes can involve authenticated state.

Do not assume that a route being visible in the browser means its API data is public.

---

# 15. ADMIN / PRIVATE ROUTES

```text
/cah-expert-control

/private
/private/login
/private/notes
/private/notes/[id]
```

Admin and private areas must remain outside public caching strategies.

---

# 16. API ARCHITECTURE

The API is organized by domain.

```text
/api/admin/*
/api/analytics/*
/api/auth/*
/api/blogs/*
/api/calculator
/api/careers/*
/api/courses/*
/api/drawings/*
/api/invoices/*
/api/leads/*
/api/mentorship/*
/api/notifications
/api/payment-items/*
/api/payments/*
/api/portfolio/*
/api/private/*
/api/profile-avatars*
/api/projects/*
/api/proposals
/api/services
/api/site/*
/api/study-materials/*
/api/support-messages
/api/team-onboarding
/api/testimonials
/api/tickets/*
/api/upload*
/api/user/*
/api/vendors/*
/api/work-with-us/*
```

---

# 17. COMPLETE API INVENTORY

## Admin

```text
/api/admin/activity-event
/api/admin/activity-log
/api/admin/admin-accounts
/api/admin/career-applications
/api/admin/career-settings
/api/admin/course-enrollments
/api/admin/courses
/api/admin/db-tools
/api/admin/login
/api/admin/logout
/api/admin/mentorship
/api/admin/payment-events
/api/admin/payment-items
/api/admin/payment-items/[id]
/api/admin/payments/coupons
/api/admin/payments/export
/api/admin/payments/generate-link
/api/admin/payments/manual
/api/admin/payments/offers
/api/admin/payments/overview
/api/admin/payments/refund
/api/admin/portfolio/seed
/api/admin/profile
/api/admin/public-chat
/api/admin/service-payments
/api/admin/services
/api/admin/session
/api/admin/suggestions
/api/admin/team-members
/api/admin/upload-image
/api/admin/users
/api/admin/vendor-leads
/api/admin/vendors
```

## Analytics

```text
/api/analytics/summary
/api/analytics/track
```

## Authentication

```text
/api/auth/google-config
/api/auth/send-otp
/api/auth/status
/api/auth/verify-otp
```

## Content

```text
/api/blogs
/api/blogs/[id]
/api/portfolio
/api/portfolio/[id]
/api/services
/api/testimonials
```

## Engineering

```text
/api/calculator
```

## Education

```text
/api/courses
/api/courses/[slug]
/api/courses/enroll
/api/courses/my-enrollments

/api/study-materials
/api/study-materials/[id]
/api/study-materials/[id]/download
```

## Customer/business

```text
/api/drawings
/api/drawings/[id]

/api/invoices
/api/invoices/[id]

/api/leads
/api/leads/[id]

/api/notifications

/api/projects
/api/projects/[id]

/api/proposals

/api/tickets
/api/tickets/[id]

/api/user/activity
/api/user/payment-activity
/api/user/profile
/api/user/purchases
/api/user/service-payments
```

## Mentorship

```text
/api/mentorship/apply
/api/mentorship/my-applications
/api/mentorship/settings
```

## Payments

```text
/api/payment-items/[slug]
/api/payments/check-coupon
/api/payments/create-order
/api/payments/verify-order
/api/payments/verify
/api/payments/webhook
```

## Private

```text
/api/private/login
/api/private/logout
/api/private/notes
/api/private/notes/[id]
```

## Support

```text
/api/support-messages
```

## Vendors

```text
/api/vendors
/api/vendors/[id]
/api/vendors/contact
/api/vendors/portfolio-upload
/api/vendors/register
```

## Uploads

```text
/api/upload
/api/uploads/[filename]
/api/admin/upload-image
```

## Careers

```text
/api/careers/settings
/api/work-with-us/apply
```

---

# 18. API SECURITY FLOW

A protected API should conceptually follow:

```text
REQUEST
  ↓
Parse
  ↓
Validate
  ↓
Identify user
  ↓
Verify authentication
  ↓
Verify authorization
  ↓
Verify ownership/entitlement
  ↓
Execute business operation
  ↓
Persist
  ↓
Return safe response
```

Do not skip the authorization stage just because the frontend has hidden the relevant button.

---

# 19. FRONTEND STATE ARCHITECTURE

Main shared context:

```text
src/context/ProjectContext.tsx
```

It manages shared state for:

```text
leads
projects
drawings
invoices
notifications
chat
tickets
blogs
portfolio
services
```

It also manages:

```text
refresh
admin alerts
notification baseline
notification sound
role-aware data loading
```

---

# 20. `ProjectContext` RESPONSIBILITY

The context is intended to reduce duplicate API calls and centralize common business operations.

Typical responsibilities:

```text
fetch data
refresh data
create records
update records
delete records
track notification state
expose user-facing state
expose admin-facing state
```

Do not create another global state system unless the existing architecture is demonstrably insufficient.

---

# 21. DOMAIN MODEL — LEADS

Lead structure:

```text
id
name
email
phone
service
source
details
status
date
```

Statuses:

```text
new
contacted
converted
archived
```

Lead lifecycle:

```text
new
 ↓
contacted
 ↓
converted
```

or:

```text
new/contacted
 ↓
archived
```

---

# 22. DOMAIN MODEL — PROJECTS

Project structure:

```text
id
title
clientName
clientEmail
service
areaSqFt
location
status
progress
drawings
quoteAmount
invoicePaid
dateStarted
```

Project states:

```text
Uploaded
Under Review
Designing
Completed
```

A project can connect to:

```text
client
drawings
invoice
service
project progress
```

---

# 23. DOMAIN MODEL — DRAWINGS

Drawing/file structure includes:

```text
id
name
size
uploadDate
status
serviceType
url
clientName
clientEmail
projectId
```

Statuses:

```text
Processed
Analyzing
Ready
```

The drawing system must be treated as potentially private customer data.

---

# 24. DOMAIN MODEL — INVOICES

Invoice structure:

```text
id
projectId
projectTitle
amount
dueDate
status
dateGenerated
paymentLink
```

Statuses:

```text
Unpaid
Paid
```

Invoice access must be ownership-aware.

---

# 25. DOMAIN MODEL — NOTIFICATIONS

```text
id
title
message
type
timestamp
read
isAdmin
userEmail
recipientName
```

Types:

```text
info
success
warning
danger
```

---

# 26. DOMAIN MODEL — BLOGS

```text
id
title
content
summary
category
date
author
image
imageAlt
status
slug
tags
seoTitle
seoDescription
canonicalUrl
featured
views
likes
shares
updatedAt
```

The blog system is a major content-quality area.

---

# 27. DOMAIN MODEL — TICKETS

Tickets support:

```text
ticket number
subject
category
priority
status
customer
email
source
description
createdAt
updatedAt
messages
attachments
```

Categories:

```text
Structural Design
Drawing / Blueprint Query
Billing & Quotation
Site Supervision
General Inquiry
```

Priority:

```text
Low
Medium
High
Urgent
```

Status:

```text
Open
In Progress
Resolved
Closed
```

---

# 28. DOMAIN MODEL — CHAT

Chat messages identify:

```text
client
system
admin
```

The public chat and admin public-chat panel are separate sides of the same operational workflow.

---

# 29. AUTHENTICATION — CUSTOMER

Customer identity:

```text
Firebase Authentication
```

Server identity verification:

```text
src/lib/firebase-verify.ts
```

Client initialization:

```text
src/lib/firebase.ts
```

The server should never trust a user ID supplied in JSON when the authenticated token can provide the true identity.

Use the verified identity as the authoritative source.

---

# 30. CUSTOMER EMAIL VERIFICATION

The application uses an additional verification layer.

Relevant API:

```text
/api/auth/send-otp
/api/auth/verify-otp
/api/auth/status
```

MongoDB record:

```text
email_verifications
```

Conceptual lifecycle:

```text
Firebase identity
      ↓
OTP sent
      ↓
OTP verified
      ↓
application verification state
      ↓
protected business access
```

---

# 31. ADMIN AUTHENTICATION

Admin login:

```text
/api/admin/login
```

Admin logout:

```text
/api/admin/logout
```

Session:

```text
cah_admin_session
```

Secret:

```text
NEXTAUTH_SECRET
```

Session lifetime in the implementation is approximately:

```text
1 hour
```

The server should validate:

```text
signature
expiration
role
user identity
```

---

# 32. ADMIN AUTHORIZATION

Custom admin authorization should be checked dynamically.

This means:

```text
authentication
```

proves who the user is, while:

```text
MongoDB permission record
```

proves what they can currently do.

This allows immediate permission revocation.

---

# 33. ADMIN PERMISSION MODULES

Current permission vocabulary includes:

```text
analytics
activityLog
clients
registeredUsers
leads
projects
drawings
invoices
paymentSetup
paymentOffers
paymentHistory
tickets
publicChat
blogs
portfolio
services
pricing
notifications
mentorship
softwareCourses
studyMaterials
careers
teamMembers
vendors
vendorLeads
```

These IDs are part of the authorization contract.

Do not rename them casually.

---

# 34. ADMIN SECURITY RULE

A custom admin with:

```text
all normal modules
```

is still:

```text
custom
```

not:

```text
superadmin
```

Only the true master account has unrestricted administrator-management authority.

---

# 35. MONGODB

Primary file:

```text
src/lib/mongodb.ts
```

Database defaults to:

```text
civil-at-hand
```

if `MONGODB_DB` is not supplied.

Connection options include:

```text
connectTimeoutMS: 10000
serverSelectionTimeoutMS: 10000
socketTimeoutMS: 30000
maxPoolSize: 10
retryWrites: true
```

The client promise is reused globally to reduce unnecessary connection creation.

---

# 36. DATABASE COLLECTION STRATEGY

Major logical collections:

```text
admin_accounts
email_verifications

payment_items
payment_events
payment_offers
payment_coupons

projects
drawings
invoices
leads
notifications
tickets

blogs
portfolio
services
testimonials

courses
course_enrollments
study_materials

vendors
vendor leads
mentorship applications
career applications

proposals
support messages
private notes

activity/analytics records
team members
```

Some collections may have names derived by individual modules.

Always verify the existing implementation before changing collection names.

---

# 37. DATABASE OWNERSHIP PRINCIPLE

MongoDB is the source of truth for dynamic business data.

The browser context is a:

```text
cache/state representation
```

not the canonical database.

Therefore:

```text
React state ≠ database
```

---

# 38. DATABASE MIGRATION RULES

Never make an irreversible schema change without considering existing production data.

Safe sequence:

```text
1. Identify old schema
2. Identify existing records
3. Add backward-compatible code
4. Migrate
5. Verify
6. Switch reads
7. Switch writes
8. Remove legacy support later
```

Avoid one-step destructive changes.

---

# 39. PAYMENT SYSTEM

Payment core:

```text
Razorpay
```

Supporting files:

```text
src/lib/razorpay.ts
src/lib/paymentClient.ts
src/lib/paymentAccess.ts
src/lib/paymentFulfillment.ts
```

---

# 40. PAYMENT LIFECYCLE

```text
Customer
   ↓
Select product
   ↓
Authenticate
   ↓
Check eligibility
   ↓
Create Razorpay order
   ↓
Open checkout
   ↓
Payment
   ↓
Client verification
   +
Razorpay webhook
   ↓
Payment event
   ↓
Idempotent fulfillment
   ↓
Entitlement
   ↓
Feature access
```

---

# 41. PAYMENT ACCESS

Payment access checks should verify:

```text
payment item exists
item is active
user is authenticated
user is verified where required
payment is required or free
successful payment event exists
payment has not been invalidated/refunded
entitlement has not been consumed
```

---

# 42. PAYMENT IDEMPOTENCY

Unique payment identifier:

```text
Razorpay payment ID
```

Important index:

```text
uniq_razorpay_payment_id
```

Purpose:

```text
same payment
+
multiple confirmation attempts
=
one business fulfillment
```

This protects against duplicate processing.

---

# 43. FREE VS PAID

The payment architecture supports both.

For a free item:

```text
amount = 0
```

The user may still be required to authenticate.

For a paid item:

```text
amount > 0
```

A successful payment event is required.

Never infer entitlement from the frontend.

---

# 44. COUPONS

Coupon system supports:

```text
coupon code
discount
usage count
active/inactive
payment item association where applicable
```

Endpoint:

```text
/api/payments/check-coupon
```

Admin:

```text
/api/admin/payments/coupons
```

---

# 45. OFFERS

Offers can be managed through:

```text
/api/admin/payments/offers
```

Payment events can retain:

```text
offerId
offerTitle
```

This preserves historical payment context even if an offer changes later.

---

# 46. REFUNDS

Refund API:

```text
/api/admin/payments/refund
```

Refund behavior must be tested against:

```text
entitlement
invoice
payment event
admin history
```

A refund must not leave the system believing a revoked entitlement is still active if the product's business rules require revocation.

---

# 47. WEBHOOK

Endpoint:

```text
/api/payments/webhook
```

Webhook is a server-to-server mechanism.

Never replace it with:

```text
success page = payment confirmed
```

The success page is a UX page.

The webhook/verification pipeline is a financial event-processing system.

---

# 48. VENDOR REGISTRATION

Vendor registration uses:

```text
src/lib/vendorRegistration.ts
```

Payment item slug:

```text
vendor-registration
```

Flow:

```text
Vendor
 ↓
Authenticate
 ↓
Check vendor-registration item
 ↓
Check payment/entitlement
 ↓
Check previous use
 ↓
Register
```

The entitlement should not be treated as unlimited reusable access.

---

# 49. EDUCATION SYSTEM

Main routes:

```text
/education
/education/courses
/education/courses/[course]
/education/study-materials
/education/study-materials/[slug]
/mentorship
```

APIs:

```text
/api/courses
/api/courses/[slug]
/api/courses/enroll
/api/courses/my-enrollments

/api/study-materials
/api/study-materials/[id]
/api/study-materials/[id]/download

/api/mentorship/apply
/api/mentorship/my-applications
/api/mentorship/settings
```

---

# 50. EDUCATION CONFIGURATION

Central file:

```text
src/data/education/site.ts
```

It contains payment/form configuration.

Current mentorship price:

```text
₹999
```

When changing the price:

```text
1. update configuration
2. verify payment catalog
3. verify checkout
4. verify admin
5. verify entitlement
6. verify public copy
```

Do not update only the visible text.

---

# 51. STUDY MATERIAL STORAGE

Study materials can be stored using MongoDB GridFS.

Bucket:

```text
study_material_files
```

Maximum file size:

```text
25 MB
```

Download route:

```text
/api/study-materials/[id]/download
```

Protected download logic should verify the user's access before returning the file.

---

# 52. FILE UPLOAD SECURITY

For every upload:

```text
authenticate if private
authorize ownership/permission
validate filename
validate size
validate type
store safely
return safe reference
```

Never use a browser-supplied filename as an unrestricted filesystem path.

---

# 53. BLOG/CMS

Blog API:

```text
/api/blogs
/api/blogs/[id]
```

Admin:

```text
BlogsPanel.tsx
```

Blog system supports:

```text
draft
published
SEO fields
tags
featured content
views
likes
shares
```

---

# 54. BLOG SECURITY

Stored HTML must pass through:

```text
src/lib/sanitizeHtml.ts
```

This protects against stored XSS.

If a developer introduces another rich-text field:

```text
sanitize it
```

before rendering.

---

# 55. CONTENT QUALITY

Because the site received a low-value-content warning, content architecture is a first-class engineering concern.

Do not optimize only for:

```text
number of URLs
```

Optimize for:

```text
usefulness
originality
expertise
completeness
navigation
trust
```

---

# 56. ADDSENSE / LOW-VALUE CONTENT SOLUTION

The platform should build content around real engineering utility.

Strong page types:

```text
technical guides
worked examples
case studies
calculators
unit conversion tools
standards explanations
service methodology
FAQ pages
course lessons
study resources
project documentation
```

Weak page types:

```text
keyword-only pages
city-only variations
generic AI paragraphs
copied text
thin service descriptions
empty category pages
```

---

# 57. SERVICE/CITY SEO

Route:

```text
/services/[service]/[city]
```

Every localized page should provide actual value.

Possible local information:

```text
project types
regional conditions
typical requirements
authority considerations
common client problems
actual local examples
FAQs
availability
```

Do not generate thousands of identical city pages.

---

# 58. ENGINEERING CALCULATORS

Public calculator routes:

```text
/calculators
/calculators/concrete
/concrete-calculator
```

API:

```text
/api/calculator
```

Calculator UX should explain:

```text
input
unit
formula
assumption
calculation
result
interpretation
limitation
disclaimer
```

---

# 59. ENGINEERING DISCLAIMER

Route:

```text
/engineering-disclaimer
```

Calculators are informational tools.

They should not imply that an automatically generated result is a certified engineering design.

Where appropriate, the UI should encourage professional verification.

---

# 60. PROJECT WORKFLOW

Typical project lifecycle:

```text
Lead
 ↓
Customer
 ↓
Project
 ↓
Drawings
 ↓
Review
 ↓
Design
 ↓
Invoice
 ↓
Payment
 ↓
Completion
```

The exact workflow can vary by service.

The database should remain the authoritative record.

---

# 61. DRAWING WORKFLOW

Potential lifecycle:

```text
Upload
 ↓
Stored
 ↓
Analyzing/Processing
 ↓
Ready/Processed
 ↓
Attached to project
 ↓
Customer/admin access
```

Private drawings should not be exposed through public/static caching.

---

# 62. INVOICE WORKFLOW

Typical:

```text
Project
 ↓
Invoice generated
 ↓
Unpaid
 ↓
Payment
 ↓
Paid
```

Invoices can include:

```text
amount
due date
project
payment link
date generated
status
```

---

# 63. PROPOSALS

Proposal route:

```text
/proposals
```

The admin has a proposal builder component.

A proposal can connect:

```text
lead
service
project
pricing
customer
```

When adding proposal financial logic, use the same security standard as invoice/payment flows.

---

# 64. SUPPORT SYSTEM

Public/customer support uses:

```text
/api/tickets
/api/tickets/[id]
/api/support-messages
```

Admin support:

```text
TicketsPanel.tsx
PublicChatPanel.tsx
```

Support data may contain sensitive customer information.

Treat it as private.

---

# 65. VENDOR SYSTEM

Public routes:

```text
/vendors
/vendors/[slug]
/vendor-register
```

API:

```text
/api/vendors
/api/vendors/[id]
/api/vendors/contact
/api/vendors/portfolio-upload
/api/vendors/register
```

Admin:

```text
VendorsAdminPanel.tsx
VendorLeadsPanel.tsx
```

---

# 66. CAREERS

Routes:

```text
/work-with-us
/work-with-us/[slug]
```

API:

```text
/api/work-with-us/apply
/api/careers/settings
```

Admin:

```text
CareersPanel.tsx
```

Applications can contain personal information and should not be treated as public content.

---

# 67. PORTFOLIO

Routes:

```text
/portfolio
/portfolio/[id]
```

API:

```text
/api/portfolio
/api/portfolio/[id]
```

Admin:

```text
PortfolioPanel.tsx
```

The portfolio should be used to provide actual project context, not just image grids.

---

# 68. SERVICES

Static configuration:

```text
src/data/services.ts
```

Current main service IDs:

```text
structural-design
boq-estimation
quantity-surveying
pdf-to-autocad
bim-services
interior-design
```

Service data can include:

```text
title
description
price display
details
features
standards
deliverables
icon
```

---

# 69. SEO ARCHITECTURE

SEO is distributed between:

```text
src/data/site.ts
src/app/layout.tsx
individual page metadata
StructuredData.tsx
next.config.ts
```

Core SEO concepts:

```text
title
description
canonical
Open Graph
Twitter/X
robots
structured data
internal linking
clean routes
redirects
```

---

# 70. SEO CANONICAL

Canonical production URL:

```text
https://civilathan.in
```

When changing domain:

```text
update site URL
update metadata base
update canonical
update structured data
update social metadata
update redirects
verify robots/sitemap
```

---

# 71. STRUCTURED DATA

File:

```text
src/components/StructuredData.tsx
```

Use structured data only when the schema accurately describes the page.

Do not generate fake reviews, fake ratings, fake business information, or misleading structured data.

---

# 72. PWA

Service worker:

```text
public/sw.js
```

PWA registration:

```text
src/components/ServiceWorkerRegister.tsx
```

Install prompt:

```text
src/components/InstallPrompt.tsx
```

Offline route:

```text
/offline
```

---

# 73. SERVICE WORKER CACHE STRATEGY

## Static assets

```text
cache-first
```

## HTML pages

```text
network-first
```

## Sensitive routes

```text
never cache
```

Sensitive prefixes include:

```text
/api/
/cah-expert-control
/auth
/dashboard
/profile
```

This is deliberate security behavior.

---

# 74. SERVICE WORKER UPDATE MODEL

Current cache namespace:

```text
cah-v1
```

Changing service-worker code should normally result in a new version.

Example:

```text
cah-v2
```

This helps ensure stale caches are retired.

Do not leave a modified worker under the same cache identity indefinitely.

---

# 75. SECURITY HEADERS

Current global security headers include:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

These are configured through:

```text
next.config.ts
```

---

# 76. DESIGN SYSTEM

Main file:

```text
src/app/globals.css
```

Visual language:

```text
deep navy
burnished gold
cream
slate
technical grid
engineering drafting motifs
```

Typography:

```text
Inter
Outfit
```

---

# 77. DESIGN TOKENS

The CSS uses theme variables including:

```text
--color-navy-950
--color-navy-900
--color-navy-800
--color-orange-500
--color-orange-600
--color-orange-400
--color-wix-dark
--color-wix-cream
```

The `orange-*` variable names are retained historical naming; the visual intent is closer to a premium engineering gold/bronze accent.

---

# 78. VISUAL COMPONENT LANGUAGE

Existing CSS utilities support:

```text
blueprint-grid
blueprint-grid-light
blueprint-corner
animate-spin-slow
font-mono-tag
timeline-line
premium-glass
premium shadows
```

These should be considered part of the product identity.

---

# 79. ACCESSIBILITY

Accessibility infrastructure:

```text
AccessibilityLayer.tsx
/accessibility-statement
```

Global skip link exists.

Minimum standard:

```text
keyboard navigation
focus visibility
semantic controls
image alt text
form labels
sufficient contrast
responsive layout
accessible error states
```

---

# 80. RESPONSIVE DESIGN

Test every new page at:

```text
mobile
large mobile
tablet
desktop
```

Critical mobile areas:

```text
header
admin navigation
tables
payment cards
calculator forms
drawing lists
ticket conversations
long content
```

Do not rely only on desktop screenshots.

---

# 81. PERFORMANCE

Avoid:

```text
unnecessary client components
duplicate API calls
large unoptimized images
heavy global state
expensive re-renders
unnecessary animation
large dependency additions
```

Use server rendering wherever interactivity is not required.

---

# 82. ENVIRONMENT VARIABLES

The project references:

```text
ADMIN_PASS
ADMIN_USER
ALLOWED_EMAIL_DOMAINS
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS
GOOGLE_CLIENT_ID
MONGODB_DB
MONGODB_URI
NEXTAUTH_SECRET
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPPORT_EMAIL
NEXT_PUBLIC_TEAM_ONBOARDING_PASSWORD
NODE_ENV
PRIVATE_PAGE_PASSWORD
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
SMTP_HOST
SMTP_PASS
SMTP_PORT
SMTP_SECURE
SMTP_USER
```

---

# 83. ENVIRONMENT SECURITY

## Server secrets

Never expose:

```text
ADMIN_PASS
ADMIN_USER
MONGODB_URI
NEXTAUTH_SECRET
PRIVATE_PAGE_PASSWORD
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
SMTP_PASS
SMTP_USER
```

## Browser-visible

Anything beginning with:

```text
NEXT_PUBLIC_
```

may be bundled into browser code.

Therefore:

```text
NEXT_PUBLIC_* ≠ secret
```

---

# 84. LOCAL DEVELOPMENT

## Install

```bash
npm install
```

## Environment

Create:

```text
.env.local
```

## Development

```bash
npm run dev
```

## Lint

```bash
npm run lint
```

## Production build

```bash
npm run build
```

## Production start

```bash
npm run start
```

---

# 85. LOCAL DEVELOPMENT CHECKLIST

```text
[ ] Node/npm installed
[ ] dependencies installed
[ ] .env.local created
[ ] MongoDB accessible
[ ] Firebase project configured
[ ] admin credentials configured
[ ] payment credentials configured if testing payments
[ ] SMTP configured if testing email
[ ] dev server starts
[ ] homepage works
[ ] auth works
[ ] dashboard works
[ ] admin works
```

---

# 86. PRODUCTION DEPLOYMENT

Before deployment:

```text
npm run lint
npm run build
```

Then verify production:

```text
public pages
authentication
database
admin
payments
webhooks
uploads
email
PWA
SEO
mobile
```

---

# 87. DATABASE DEPLOYMENT

Before production schema changes:

```text
backup
migration plan
test data
production compatibility
index review
rollback strategy
```

Never make a production database change solely because a local database is empty.

---

# 88. PAYMENT DEPLOYMENT

Production payment deployment requires:

```text
correct Razorpay key
correct secret
correct webhook secret
correct webhook endpoint
correct payment item
correct amount
correct currency
correct entitlement
```

After deployment, perform a real controlled payment test if business operations permit it.

---

# 89. AUTHENTICATION TESTING

Test:

```text
new user
existing user
unverified user
verified user
invalid token
expired token
missing token
logout
password recovery
OTP
Google config if enabled
```

For customer APIs, confirm that the server derives identity from verified authentication rather than trusting arbitrary request fields.

---

# 90. ADMIN TESTING

Test separately:

```text
superadmin
custom admin with one permission
custom admin with multiple permissions
custom admin with zero permissions
disabled custom admin
expired admin session
invalid signature
missing secret
database unavailable
```

For every module verify:

```text
UI visibility
API authorization
data isolation
```

---

# 91. API TESTING

For each API test:

```text
valid request
invalid request
missing required field
wrong data type
unauthenticated request
unauthorized request
wrong owner
not found
duplicate request
database failure
external service failure
```

---

# 92. PAYMENT TESTING

Minimum matrix:

```text
[ ] successful payment
[ ] failed payment
[ ] duplicate verification
[ ] duplicate webhook
[ ] browser closed after payment
[ ] invalid signature
[ ] invalid order
[ ] coupon
[ ] invalid coupon
[ ] offer
[ ] refund
[ ] free item
[ ] already entitled
[ ] unverified user
[ ] unauthenticated user
```

---

# 93. SEO TESTING

Check:

```text
page title
meta description
canonical
Open Graph
Twitter/X
structured data
robots
indexability
internal links
404 behavior
redirects
mobile usability
```

For service/city pages specifically check uniqueness.

---

# 94. PWA TESTING

Test:

```text
first visit
offline visit
cached public page
uncached private page
service-worker update
old cache cleanup
install prompt
offline fallback
API requests
```

Never allow private API responses to become offline public content.

---

# 95. EMAIL TESTING

Test:

```text
successful SMTP
wrong credentials
timeout
invalid recipient
missing environment variable
HTML content
plain-text fallback if applicable
```

Do not log SMTP passwords or authentication tokens.

---

# 96. UPLOAD TESTING

Test:

```text
valid file
invalid type
too-large file
missing file
duplicate filename
unauthorized user
wrong owner
download permission
deleted file
broken file reference
```

---

# 97. COMMON FAILURE — MONGODB

Symptoms:

```text
API 500
dashboard empty
admin errors
payment data missing
```

Check:

```text
MONGODB_URI
MONGODB_DB
network access
database credentials
connection limits
```

---

# 98. COMMON FAILURE — ADMIN

Check:

```text
ADMIN_USER
ADMIN_PASS
NEXTAUTH_SECRET
cah_admin_session
admin_accounts
permission module
database access
```

---

# 99. COMMON FAILURE — PAYMENTS

Check:

```text
payment item
order creation
Razorpay response
client verification
webhook
payment_events
paymentFulfillment
paymentAccess
```

If the payment exists but entitlement is missing, inspect the complete event lifecycle rather than only the UI.

---

# 100. COMMON FAILURE — DUPLICATE PAYMENT

Inspect:

```text
uniq_razorpay_payment_id
```

If a duplicate event arrives:

```text
return existing event / safely ignore duplicate
```

Do not disable the unique constraint.

---

# 101. COMMON FAILURE — STALE PWA

Check:

```text
public/sw.js
cache version
service-worker registration
browser application storage
```

A developer may need to:

```text
increment cache version
deploy
allow worker activation
```

---

# 102. COMMON FAILURE — BLOG HTML

If article HTML does not appear:

```text
check stored content
check sanitizer
check allowed tags
check editor output
```

Do not solve it by disabling sanitization.

---

# 103. COMMON FAILURE — CUSTOM ADMIN DATA

If a custom admin sees data they should not see:

```text
1. verify module ID
2. verify hasModuleAccess
3. verify API authorization
4. verify ProjectContext filtering
5. clear stale browser state
```

The API is the final authority.

---

# 104. DEBUGGING METHODOLOGY

Use this sequence:

```text
ROUTE
 ↓
COMPONENT
 ↓
REQUEST
 ↓
AUTHENTICATION
 ↓
AUTHORIZATION
 ↓
DATABASE
 ↓
EXTERNAL SERVICE
 ↓
CACHE
 ↓
BUILD
```

Do not immediately rewrite the UI when the actual failure is a server authorization or database problem.

---

# 105. FEATURE DEVELOPMENT METHODOLOGY

Every feature should start with:

```text
1. business requirement
2. user type
3. data source
4. access rules
5. API contract
6. UI
7. persistence
8. analytics
9. SEO if public
10. testing
```

---

# 106. PUBLIC FEATURE METHOD

```text
Define page purpose
 ↓
Create route
 ↓
Create content
 ↓
Create metadata
 ↓
Create structured data if appropriate
 ↓
Add internal links
 ↓
Add accessibility
 ↓
Test mobile
 ↓
Test PWA
 ↓
Build
```

---

# 107. PROTECTED FEATURE METHOD

```text
Define resource
 ↓
Define owner
 ↓
Define user role
 ↓
Define authentication
 ↓
Define authorization
 ↓
Define API
 ↓
Validate input
 ↓
Persist
 ↓
UI
 ↓
Test unauthorized behavior
```

---

# 108. PAID FEATURE METHOD

```text
Define product
 ↓
Stable slug
 ↓
Payment item
 ↓
Price
 ↓
Auth requirement
 ↓
Order
 ↓
Checkout
 ↓
Verification
 ↓
Webhook
 ↓
Idempotent fulfillment
 ↓
Entitlement
 ↓
Feature
 ↓
Refund behavior
```

---

# 109. ADMIN FEATURE METHOD

```text
Module ID
 ↓
Permission
 ↓
Navigation
 ↓
Panel
 ↓
API
 ↓
Authorization
 ↓
Database
 ↓
Refresh
 ↓
Audit/notification
 ↓
Custom-admin testing
```

---

# 110. MIGRATION METHODOLOGY

For any schema/config migration:

```text
1. inventory old state
2. define target state
3. preserve compatibility
4. migrate
5. validate
6. deploy
7. monitor
8. remove legacy behavior later
```

Do not combine:

```text
schema rename
business logic rewrite
UI rewrite
payment rewrite
```

into one untestable change.

---

# 111. DO-NOT-BREAK RULES

Never casually:

```text
remove server-side authorization
remove Firebase verification
remove OTP/application verification
remove payment idempotency
remove webhook processing
render raw stored HTML
cache dashboard data
cache admin APIs
rename database collections
rename admin permission IDs
remove SEO redirects
remove security headers
move secrets to public variables
```

---

# 112. CONTENT DO-NOT-BREAK RULES

Do not solve low-value content by:

```text
creating 1,000 city pages
copying competitors
rewriting the same article repeatedly
adding meaningless paragraphs
hiding content behind tabs solely for SEO
creating keyword pages with no user purpose
```

Instead:

```text
add original technical value
add examples
add calculations
add case studies
add expert explanations
improve navigation
```

---

# 113. DESIGN DO-NOT-BREAK RULES

Avoid replacing the established engineering identity with:

```text
random gradients
unrelated color systems
excessive animations
generic SaaS cards
tiny text
poor contrast
desktop-only interactions
```

The design should remain:

```text
technical
premium
structured
professional
engineering-focused
```

---

# 114. ACCESSIBILITY DO-NOT-BREAK RULES

Do not:

```text
remove keyboard focus
remove alt text
make buttons look like plain text
use color alone for status
remove form labels
create hover-only controls
```

---

# 115. SECURITY DO-NOT-BREAK RULES

Never:

```text
log access tokens
log passwords
store passwords in public variables
trust browser role
trust browser price
trust browser user ID
disable authorization to “fix” an API
```

---

# 116. PERFORMANCE DO-NOT-BREAK RULES

Avoid:

```text
global client state for local problems
fetching the same dataset multiple times
huge image payloads
unnecessary dependencies
large client-only components
```

---

# 117. DEVELOPER ONBOARDING — FIRST SESSION

A new developer should first understand:

```text
1. package.json
2. src/app/layout.tsx
3. src/data/site.ts
4. src/context/ProjectContext.tsx
5. src/lib/mongodb.ts
6. src/lib/firebase-verify.ts
7. src/lib/auth.ts
8. src/lib/paymentAccess.ts
9. src/lib/paymentFulfillment.ts
10. next.config.ts
11. src/app/globals.css
12. public/sw.js
```

Then inspect the specific feature area.

---

# 118. DEVELOPER ONBOARDING — SECOND SESSION

Understand:

```text
public routes
customer routes
admin routes
API route organization
MongoDB collections
payment flow
authentication flow
PWA cache rules
SEO system
```

---

# 119. DEVELOPER ONBOARDING — THIRD SESSION

Run:

```bash
npm run dev
npm run lint
npm run build
```

Then manually inspect:

```text
homepage
services
blog
calculator
auth
dashboard
admin
payment-related screens
education
vendors
```

---

# 120. MASTER FILE MAP

## Site configuration

```text
src/data/site.ts
```

## Services

```text
src/data/services.ts
```

## Portfolio seed

```text
src/data/portfolio.ts
```

## Cities

```text
src/data/cities.ts
```

## Education

```text
src/data/education/
```

## Global shell

```text
src/app/layout.tsx
src/components/SiteChrome.tsx
src/components/Header.tsx
src/components/Footer.tsx
```

## State

```text
src/context/ProjectContext.tsx
```

## Authentication

```text
src/lib/firebase.ts
src/lib/firebase-verify.ts
src/lib/auth.ts
```

## Database

```text
src/lib/mongodb.ts
```

## Payments

```text
src/lib/razorpay.ts
src/lib/paymentClient.ts
src/lib/paymentAccess.ts
src/lib/paymentFulfillment.ts
```

## Security

```text
src/lib/sanitizeHtml.ts
src/lib/rateLimit.ts
```

## Education files

```text
src/lib/studyMaterials.ts
src/data/education/site.ts
```

## Styling

```text
src/app/globals.css
```

## Infrastructure

```text
next.config.ts
public/sw.js
```

---

# 121. MASTER SYSTEM FLOW

```text
                       CIVIL AT HAND
                              |
      +-----------------------+-----------------------+
      |                       |                       |
    PUBLIC                 CUSTOMER                 ADMIN
      |                       |                       |
  SEO/content            Firebase Auth          Admin Session
  Services              Verification            Permission DB
  Blog                  Dashboard               Admin UI
  Portfolio             Projects                Operations
  Calculators           Drawings                Payments
  Education             Invoices                Analytics
  Vendors               Tickets                 Content
      |                       |                       |
      +-----------------------+-----------------------+
                              |
                        NEXT.JS SERVER
                              |
            +-----------------+-----------------+
            |                 |                 |
         MongoDB           Firebase          Razorpay
            |                 |                 |
      business records    identity          payment
      permissions         verification      webhooks
      content
```

---

# 122. FINAL ACCEPTANCE CHECKLIST

Before a production feature is considered complete:

## Functional

```text
[ ] feature works
[ ] happy path works
[ ] empty state works
[ ] loading state works
[ ] error state works
[ ] not-found state works
```

## Security

```text
[ ] authentication checked
[ ] authorization checked
[ ] ownership checked
[ ] validation checked
[ ] secrets protected
[ ] private data not cached
```

## Database

```text
[ ] schema understood
[ ] existing records protected
[ ] indexes reviewed
[ ] migration considered
[ ] duplicate behavior tested
```

## Payment

```text
[ ] price server-trusted
[ ] order verified
[ ] webhook verified
[ ] idempotency preserved
[ ] refund behavior tested
```

## SEO

```text
[ ] title
[ ] description
[ ] canonical
[ ] structured data
[ ] internal links
[ ] unique useful content
```

## UX

```text
[ ] mobile
[ ] desktop
[ ] keyboard
[ ] accessible labels
[ ] readable typography
[ ] clear feedback
```

## PWA

```text
[ ] public cache behavior
[ ] private never-cache behavior
[ ] offline behavior
[ ] service worker update behavior
```

## Quality

```text
[ ] npm run lint
[ ] npm run build
[ ] manual smoke test
```

---

# 123. MASTER DEVELOPER MENTAL MODEL

The easiest way to understand Civil At Hand is:

```text
                 CONTENT + ENGINEERING TOOLS
                              |
                              v
                      CUSTOMER ACQUISITION
                              |
                              v
                     CUSTOMER AUTHENTICATION
                              |
                              v
                       CUSTOMER PORTAL
                              |
              +---------------+---------------+
              |               |               |
           PROJECTS        DRAWINGS        INVOICES
              |               |               |
              +---------------+---------------+
                              |
                           PAYMENTS
                              |
                       ENTITLEMENTS
                              |
                              v
                       SERVICE DELIVERY
                              |
                    +---------+---------+
                    |                   |
                  SUPPORT             ADMIN
                    |                   |
                    +---------+---------+
                              |
                         OPERATIONS
```

And underneath everything:

```text
Next.js
  +
React
  +
TypeScript
  +
MongoDB
  +
Firebase
  +
Razorpay
  +
PWA
  +
SEO
```

---

# 124. FINAL PROJECT PRINCIPLES

The project should be maintained according to these principles:

### Principle 1 — Server is authoritative

The browser requests actions.

The server decides whether they are allowed.

### Principle 2 — Database is authoritative

React state is a representation, not the source of truth.

### Principle 3 — Payments are financial events

Payment success must be verified and processed idempotently.

### Principle 4 — Identity and authorization are different

Firebase proves identity.

Application rules determine business access.

Admin permissions determine administrative access.

### Principle 5 — Private data stays private

Do not expose it through:

```text
public routes
static files
service-worker caches
unauthorized APIs
client-only assumptions
```

### Principle 6 — Content must be genuinely useful

The AdSense low-value-content problem should be addressed through:

```text
originality
depth
expertise
utility
case studies
calculators
educational content
better UX
```

### Principle 7 — Existing architecture is intentional

Before replacing a system, understand why it exists.

This is especially important for:

```text
auth
payment fulfillment
service worker
permissions
MongoDB connection reuse
HTML sanitization
SEO redirects
```

---

# 125. FINAL HANDOFF STATEMENT

Civil At Hand is a full-stack engineering consultancy platform with public content, technical tools, education, customer accounts, project workflows, financial transactions, vendor operations, support, and a granular administration system.

A developer taking ownership should **not** treat individual pages as isolated features.

The correct model is:

```text
PAGE
  ↓
COMPONENT
  ↓
CLIENT STATE
  ↓
API
  ↓
AUTHENTICATION
  ↓
AUTHORIZATION
  ↓
BUSINESS RULE
  ↓
DATABASE / EXTERNAL SERVICE
  ↓
AUDIT / NOTIFICATION / ENTITLEMENT
```

For public content:

```text
PAGE
  ↓
CONTENT
  ↓
SEO
  ↓
STRUCTURED DATA
  ↓
ACCESSIBILITY
  ↓
MOBILE UX
```

For payments:

```text
USER
 ↓
AUTH
 ↓
ITEM
 ↓
ORDER
 ↓
RAZORPAY
 ↓
VERIFY
 ↓
WEBHOOK
 ↓
IDEMPOTENT EVENT
 ↓
ENTITLEMENT
```

For admin:

```text
ADMIN
 ↓
SIGNED SESSION
 ↓
ROLE
 ↓
MONGODB PERMISSION
 ↓
MODULE ACCESS
 ↓
API AUTHORIZATION
 ↓
DATA
```

For private files:

```text
USER
 ↓
AUTH
 ↓
OWNERSHIP / ENTITLEMENT
 ↓
FILE ACCESS
```

For content quality:

```text
USER INTENT
 ↓
ORIGINAL INFORMATION
 ↓
EXPLANATION
 ↓
EXAMPLE / EVIDENCE
 ↓
USEFUL TOOL OR NEXT STEP
 ↓
TRUST
```

**Do not optimize this project only for more pages, more URLs, or more ads. Optimize it for real engineering usefulness, reliable business workflows, strong security, excellent user experience, and durable technical architecture.**

---

# 126. QUICK REFERENCE — IF YOU ONLY REMEMBER 20 THINGS

```text
1. Next.js App Router is the application framework.
2. React/TypeScript power the UI.
3. MongoDB stores dynamic business data.
4. Firebase handles customer identity.
5. Admin authentication is separate from Firebase.
6. Custom-admin permissions come from MongoDB.
7. Never trust browser authorization.
8. Never trust browser payment amounts.
9. Razorpay webhooks are important.
10. Payment fulfillment must remain idempotent.
11. Stored HTML must be sanitized.
12. Private pages/APIs must not be service-worker cached.
13. Site identity is centralized in src/data/site.ts.
14. Service definitions are centralized in src/data/services.ts.
15. ProjectContext is the main shared client-state layer.
16. next.config.ts controls important security/redirect/PWA behavior.
17. globals.css controls the main design system.
18. public/sw.js controls offline/cache behavior.
19. AdSense low-value content requires better original content, not mass-generated pages.
20. Always run `npm run lint` and `npm run build` before production.
```

---

# END OF MASTER README

**This document is the intended developer handoff reference for the Civil At Hand project.**
