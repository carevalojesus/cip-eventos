# Data Pseudonymization - System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    GDPR DATA PSEUDONYMIZATION                    │
│                         SYSTEM ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│              │        │              │        │              │
│     User     │───────▶│  Frontend    │───────▶│   Backend    │
│              │        │  (React)     │        │  (NestJS)    │
└──────────────┘        └──────────────┘        └──────────────┘
                                                        │
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        │                               │                               │
                        ▼                               ▼                               ▼
                ┌───────────────┐             ┌───────────────┐             ┌───────────────┐
                │               │             │               │             │               │
                │ UsersModule   │◀────────────│ PersonsModule │             │   Database    │
                │               │  forwardRef │               │             │  (PostgreSQL) │
                └───────────────┘             └───────────────┘             └───────────────┘
                        │                               │                           │
                        │                               │                           │
                        ▼                               ▼                           │
                ┌───────────────┐             ┌───────────────┐                   │
                │               │             │               │                   │
                │ UsersService  │             │DataDeletionSvc│◀──────────────────┘
                │               │────────────▶│               │
                └───────────────┘             └───────────────┘
```

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND COMPONENTS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         CONTROLLERS                                 │    │
│  │                                                                      │    │
│  │  ┌──────────────────────┐        ┌──────────────────────┐          │    │
│  │  │                      │        │                      │          │    │
│  │  │  UsersController     │        │  PersonsController   │          │    │
│  │  │                      │        │                      │          │    │
│  │  │  POST /request-      │        │  POST /:id/pseudo-   │          │    │
│  │  │       deletion       │        │       nymize         │          │    │
│  │  │                      │        │  GET  /:id/deletion- │          │    │
│  │  │                      │        │       status         │          │    │
│  │  │                      │        │  GET  /pending-      │          │    │
│  │  │                      │        │       deletions      │          │    │
│  │  └──────────────────────┘        └──────────────────────┘          │    │
│  │            │                               │                        │    │
│  └────────────┼───────────────────────────────┼────────────────────────┘    │
│               │                               │                              │
│  ┌────────────┼───────────────────────────────┼────────────────────────┐    │
│  │            │         SERVICES              │                        │    │
│  │            │                               │                        │    │
│  │            ▼                               ▼                        │    │
│  │  ┌──────────────────────┐        ┌──────────────────────┐          │    │
│  │  │                      │        │                      │          │    │
│  │  │   UsersService       │        │DataDeletionService   │          │    │
│  │  │                      │◀───────│                      │          │    │
│  │  │  - requestDeletion() │        │  - requestDeletion() │          │    │
│  │  │                      │        │  - executePseudo-    │          │    │
│  │  │                      │        │    nymization()      │          │    │
│  │  │                      │        │  - getDeletionStatus│          │    │
│  │  │                      │        │  - getPendingDel-   │          │    │
│  │  │                      │        │    etionRequests()  │          │    │
│  │  └──────────────────────┘        └──────────────────────┘          │    │
│  │                                            │                        │    │
│  └────────────────────────────────────────────┼────────────────────────┘    │
│                                               │                              │
│  ┌────────────────────────────────────────────┼────────────────────────┐    │
│  │              REPOSITORIES                  │                        │    │
│  │                                            ▼                        │    │
│  │                          ┌──────────────────────────┐              │    │
│  │                          │                          │              │    │
│  │                          │  TypeORM Repositories    │              │    │
│  │                          │                          │              │    │
│  │                          │  - PersonRepository      │              │    │
│  │                          │  - UserRepository        │              │    │
│  │                          │                          │              │    │
│  │                          └──────────────────────────┘              │    │
│  │                                     │                              │    │
│  └─────────────────────────────────────┼──────────────────────────────┘    │
│                                        │                                    │
└────────────────────────────────────────┼────────────────────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │                     │
                              │   PostgreSQL DB     │
                              │                     │
                              │  - persons table    │
                              │  - users table      │
                              │                     │
                              └─────────────────────┘
```

## Data Flow Diagram

### Flow 1: User Requests Deletion

```
┌──────┐         ┌──────────┐         ┌──────────────┐         ┌──────────────┐
│      │         │          │         │              │         │              │
│ User │────────▶│ Frontend │────────▶│ UsersCtrl    │────────▶│ UsersService │
│      │ Click   │          │  POST   │              │ call    │              │
└──────┘ Button  └──────────┘ /req-del└──────────────┘         └──────────────┘
                                                                        │
                                                                        │
                                                                        ▼
                                                              ┌──────────────────┐
                                                              │                  │
                                                              │ DataDeletionSvc  │
                                                              │                  │
                                                              │ requestDeletion()│
                                                              └──────────────────┘
                                                                        │
                                                                        │
                                                                        ▼
                                                              ┌──────────────────┐
                                                              │                  │
                                                              │   Find Person    │
                                                              │   by userId      │
                                                              │                  │
                                                              └──────────────────┘
                                                                        │
                                                                        │
                                                                        ▼
                                                              ┌──────────────────┐
                                                              │                  │
                                                              │ Set deletionReq- │
                                                              │ uestedAt = NOW   │
                                                              │                  │
                                                              └──────────────────┘
                                                                        │
                                                                        │
                                                                        ▼
                                                              ┌──────────────────┐
                                                              │                  │
                                                              │  Save to DB      │
                                                              │                  │
                                                              └──────────────────┘
```

### Flow 2: Admin Executes Pseudonymization

```
┌───────┐       ┌──────────┐       ┌──────────────┐       ┌──────────────────┐
│       │       │          │       │              │       │                  │
│ Admin │──────▶│ Frontend │──────▶│ PersonsCtrl  │──────▶│DataDeletionSvc   │
│       │ POST  │          │ API   │              │ call  │                  │
└───────┘       └──────────┘       └──────────────┘       └──────────────────┘
                                                                     │
                                                                     │
                                                                     ▼
                                                           ┌──────────────────┐
                                                           │                  │
                                                           │ Find Person      │
                                                           │ Load Relations   │
                                                           │                  │
                                                           └──────────────────┘
                                                                     │
                                                                     │
                                                                     ▼
                                                           ┌──────────────────┐
                                                           │                  │
                                                           │ Validate:        │
                                                           │ - Not already    │
                                                           │   pseudonymized  │
                                                           │ - Person exists  │
                                                           │                  │
                                                           └──────────────────┘
                                                                     │
                                                                     │
                                                                     ▼
                                                           ┌──────────────────┐
                                                           │                  │
                                                           │ Anonymize PII:   │
                                                           │ ───────────────  │
                                                           │ firstName =      │
                                                           │   "Usuario"      │
                                                           │ lastName =       │
                                                           │   "Eliminado"    │
                                                           │ email = deleted_ │
                                                           │   [uuid]@...     │
                                                           │ phone = null     │
                                                           │ etc.             │
                                                           │                  │
                                                           └──────────────────┘
                                                                     │
                                                                     │
                                                                     ▼
                                                           ┌──────────────────┐
                                                           │                  │
                                                           │ Set Metadata:    │
                                                           │ ───────────────  │
                                                           │ isPseudonymized  │
                                                           │   = true         │
                                                           │ pseudonymizedAt  │
                                                           │   = NOW          │
                                                           │ pseudonymizedBy  │
                                                           │   = admin        │
                                                           │                  │
                                                           └──────────────────┘
                                                                     │
                                                                     │
                                                                     ▼
                                                           ┌──────────────────┐
                                                           │                  │
                                                           │ Deactivate User: │
                                                           │ ───────────────  │
                                                           │ isActive = false │
                                                           │ deletedAt = NOW  │
                                                           │ deletionReason   │
                                                           │                  │
                                                           └──────────────────┘
                                                                     │
                                                                     │
                                                                     ▼
                                                           ┌──────────────────┐
                                                           │                  │
                                                           │ Save Changes     │
                                                           │ to Database      │
                                                           │                  │
                                                           └──────────────────┘
                                                                     │
                                                                     │
                                                                     ▼
                                                           ┌──────────────────┐
                                                           │                  │
                                                           │ Return           │
                                                           │ Pseudonymized    │
                                                           │ Person           │
                                                           │                  │
                                                           └──────────────────┘
```

## Database Schema

```
┌───────────────────────────────────────────────────────────────────┐
│                          persons TABLE                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  EXISTING FIELDS:                                                  │
│  ────────────────                                                  │
│  • id (uuid, PK)                                                   │
│  • firstName (text)                                                │
│  • lastName (text)                                                 │
│  • email (text)                                                    │
│  • documentType (enum)                                             │
│  • documentNumber (text)                                           │
│  • phone (text, nullable)                                          │
│  • country (text, nullable)                                        │
│  • birthDate (date, nullable)                                      │
│  • guardianName (text, nullable)                                   │
│  • guardianDocument (text, nullable)                               │
│  • guardianPhone (text, nullable)                                  │
│  • guardianAuthorizationUrl (text, nullable)                       │
│  • flagRisk (boolean)                                              │
│  • userId (uuid, FK -> users)                                      │
│  • createdAt (timestamptz)                                         │
│  • updatedAt (timestamptz)                                         │
│                                                                    │
│  NEW FIELDS (PSEUDONYMIZATION):                                    │
│  ───────────────────────────────                                   │
│  • isPseudonymized (boolean, default false) ◄── NEW!               │
│  • pseudonymizedAt (timestamptz, nullable)  ◄── NEW!               │
│  • pseudonymizedById (uuid, FK -> users)    ◄── NEW!               │
│  • deletionRequestedAt (timestamptz, null)  ◄── NEW!               │
│                                                                    │
│  INDEXES:                                                          │
│  ────────                                                          │
│  • IDX_persons_isPseudonymized               ◄── NEW!              │
│  • IDX_persons_deletionRequestedAt (partial) ◄── NEW!              │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                           users TABLE                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  EXISTING FIELDS:                                                  │
│  ────────────────                                                  │
│  • id (uuid, PK)                                                   │
│  • email (text, unique)                                            │
│  • password (text)                                                 │
│  • isActive (boolean)                                              │
│  • isVerified (boolean)                                            │
│  • roleId (uuid, FK -> roles)                                      │
│  • createdAt (timestamptz)                                         │
│  • updatedAt (timestamptz)                                         │
│                                                                    │
│  NEW FIELDS (DELETION):                                            │
│  ───────────────────────                                           │
│  • deletedAt (timestamptz, nullable)        ◄── NEW!               │
│  • deletionReason (text, nullable)          ◄── NEW!               │
│                                                                    │
│  INDEXES:                                                          │
│  ────────                                                          │
│  • IDX_users_deletedAt (partial)            ◄── NEW!               │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

## State Machine

```
┌──────────────────────────────────────────────────────────────────┐
│              PERSON PSEUDONYMIZATION STATE MACHINE                │
└──────────────────────────────────────────────────────────────────┘

                   ┌─────────────┐
                   │             │
                   │   ACTIVE    │
                   │             │
                   │ isPseudo=F  │
                   │ delReq=NULL │
                   └─────────────┘
                         │
                         │ User requests
                         │ deletion
                         │
                         ▼
                   ┌─────────────┐
                   │             │
                   │  PENDING    │
                   │  DELETION   │
                   │             │
                   │ isPseudo=F  │
                   │ delReq=DATE │
                   └─────────────┘
                         │
                         │ Admin executes
                         │ pseudonymization
                         │
                         ▼
                   ┌─────────────┐
                   │             │
                   │ PSEUDONYM-  │
                   │   IZED      │
                   │             │
                   │ isPseudo=T  │
                   │ pseudoAt=D  │
                   │ pseudoBy=U  │
                   └─────────────┘
                         │
                         │ FINAL STATE
                         │ (irreversible)
                         │
                         ▼
                   ┌─────────────┐
                   │             │
                   │  ARCHIVED   │
                   │             │
                   │ Data is     │
                   │ anonymized  │
                   │ Relations   │
                   │ preserved   │
                   └─────────────┘
```

## Module Dependencies

```
                    ┌──────────────────┐
                    │                  │
                    │   AppModule      │
                    │                  │
                    └────────┬─────────┘
                             │
                ┌────────────┼────────────┐
                │                         │
                ▼                         ▼
        ┌──────────────┐          ┌──────────────┐
        │              │          │              │
        │ UsersModule  │◄────────▶│PersonsModule │
        │              │forwardRef│              │
        └──────────────┘          └──────────────┘
                │                         │
                │                         │
                │                         ├─────┐
                │                         │     │
                ▼                         ▼     ▼
        ┌──────────────┐          ┌─────────────┬──────────────┐
        │              │          │             │              │
        │ UsersService │◄────────▶│PersonsService│DataDeletion │
        │              │forwardRef│             │   Service    │
        └──────────────┘          └─────────────┴──────────────┘
                │                         │            │
                │                         │            │
                └─────────────┬───────────┴────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │                  │
                    │   TypeORM        │
                    │   Repositories   │
                    │                  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │                  │
                    │   PostgreSQL     │
                    │                  │
                    └──────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY & AUTHORIZATION                  │
└─────────────────────────────────────────────────────────────┘

Endpoint: POST /users/request-deletion
┌──────────────────────────────────────────────────┐
│ ✓ JwtAuthGuard        - Must be authenticated    │
│ ✓ EmailVerifiedGuard  - Email must be verified   │
│ ✓ CurrentUser         - Gets userId from token   │
│ × RoleGuard           - Any authenticated user   │
└──────────────────────────────────────────────────┘

Endpoint: POST /persons/:id/pseudonymize
┌──────────────────────────────────────────────────┐
│ ✓ JwtAuthGuard        - Must be authenticated    │
│ ✓ RolesGuard          - Must be admin            │
│ ✓ Roles Decorator     - ORG_ADMIN or SUPER_ADMIN │
│ ✓ CurrentUser         - Gets userId from token   │
└──────────────────────────────────────────────────┘

Endpoint: GET /persons/:id/deletion-status
┌──────────────────────────────────────────────────┐
│ ✓ JwtAuthGuard        - Must be authenticated    │
│ × RoleGuard           - Any authenticated user   │
└──────────────────────────────────────────────────┘

Endpoint: GET /persons/pending-deletions
┌──────────────────────────────────────────────────┐
│ ✓ JwtAuthGuard        - Must be authenticated    │
│ ✓ RolesGuard          - Must be admin            │
│ ✓ Roles Decorator     - ORG_ADMIN or SUPER_ADMIN │
└──────────────────────────────────────────────────┘
```

## GDPR Compliance Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      GDPR ARTICLE MAPPING                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Article 17 - Right to be Forgotten                             │
│  ─────────────────────────────────                              │
│  ✓ User can request deletion                                    │
│  ✓ Personal data is erased                                      │
│  ✓ Exceptions maintained (legal obligations)                    │
│                                                                  │
│  Article 5 - Data Minimization                                  │
│  ────────────────────────────                                   │
│  ✓ Only necessary data retained                                 │
│  ✓ PII completely anonymized                                    │
│                                                                  │
│  Article 5 - Purpose Limitation                                 │
│  ─────────────────────────────                                  │
│  ✓ Retained data only for audit                                 │
│  ✓ Clear purpose documented                                     │
│                                                                  │
│  Article 25 - Data Protection by Design                         │
│  ──────────────────────────────────────                         │
│  ✓ Pseudonymization built-in                                    │
│  ✓ Security measures implemented                                │
│                                                                  │
│  Article 30 - Records of Processing                             │
│  ──────────────────────────────────                             │
│  ✓ Complete audit trail                                         │
│  ✓ Timestamps and user tracking                                 │
│  ✓ Reason documentation                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
backend/
├── src/
│   ├── persons/
│   │   ├── dto/
│   │   │   ├── pseudonymize-person.dto.ts      ◄── NEW
│   │   │   └── deletion-status.dto.ts          ◄── NEW
│   │   ├── entities/
│   │   │   └── person.entity.ts                ◄── MODIFIED
│   │   ├── services/
│   │   │   └── data-deletion.service.ts        ◄── NEW
│   │   ├── persons.controller.ts               ◄── MODIFIED
│   │   └── persons.module.ts                   ◄── MODIFIED
│   ├── users/
│   │   ├── dto/
│   │   │   └── request-deletion.dto.ts         ◄── NEW
│   │   ├── entities/
│   │   │   └── user.entity.ts                  ◄── MODIFIED
│   │   ├── users.controller.ts                 ◄── MODIFIED
│   │   ├── users.service.ts                    ◄── MODIFIED
│   │   └── users.module.ts                     ◄── MODIFIED
│   └── database/
│       └── migrations/
│           └── 1733490000000-AddData           ◄── NEW
│               PseudonymizationFields.ts
├── DATA_PSEUDONYMIZATION.md                    ◄── NEW
├── PSEUDONYMIZATION_EXAMPLES.md                ◄── NEW
├── PSEUDONYMIZATION_IMPLEMENTATION_SUMMARY.md  ◄── NEW
└── PSEUDONYMIZATION_ARCHITECTURE.md            ◄── NEW (this file)
```
