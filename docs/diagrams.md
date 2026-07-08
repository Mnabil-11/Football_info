# System Design — Football Stats Tracker

UML diagrams for Phase 3, expressed in [Mermaid](https://mermaid.js.org/) so they
render directly on GitHub and in [mermaid.live](https://mermaid.live).

---

## 1. Use Case Diagram

Shows how the two actors — a **Guest** (unauthenticated) and a **Registered User** —
interact with the system. Guests can explore public football data; registered users
additionally manage an account and favorites.

```mermaid
flowchart LR
    Guest(("👤 Guest"))
    User(("🔐 Registered User"))

    subgraph System["Football Stats Tracker"]
        UC1["Search for a team"]
        UC2["View team matches"]
        UC3["View team squad"]
        UC4["View player statistics"]
        UC5["Calculate fantasy points"]
        UC6["Register"]
        UC7["Login / Logout"]
        UC8["Add / remove favorite team"]
        UC9["View profile & favorites"]
        UC10["View favorites-only dashboard"]
    end

    Guest --> UC1
    Guest --> UC2
    Guest --> UC3
    Guest --> UC4
    Guest --> UC5
    Guest --> UC6
    Guest --> UC7

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
```

**Explanation:** Public data browsing (search, matches, squad, stats, fantasy) is open
to everyone. Registration/login gate the personalized features — managing favorites,
viewing the profile, and filtering the dashboard to favorite teams only.

---

## 2. Class Diagram

Domain model of the persisted entities and their behaviors. `Match` and `Player` are
sourced live from API-Football (not stored), but appear here because favorites reference
them by external id.

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String password
        +String name
        +String? avatar
        +DateTime createdAt
        +register()
        +login()
    }

    class FavoriteTeam {
        +String id
        +String userId
        +Int teamId
        +String teamName
        +String? teamLogo
        +DateTime createdAt
    }

    class FavoritePlayer {
        +String id
        +String userId
        +Int playerId
        +String playerName
        +String? playerPhoto
        +DateTime createdAt
    }

    class FantasyTeam {
        +String id
        +String userId
        +String name
        +DateTime createdAt
    }

    class FantasyTeamPlayer {
        +String id
        +String fantasyTeamId
        +Int playerId
        +String position
    }

    class Team {
        +Int id
        +String name
        +String logo
        +String country
    }

    class Player {
        +Int id
        +String name
        +String position
        +Int age
    }

    class Match {
        +Int id
        +Int homeTeamId
        +Int awayTeamId
        +DateTime kickoff
    }

    User "1" --> "0..*" FavoriteTeam : owns
    User "1" --> "0..*" FavoritePlayer : owns
    User "1" --> "0..*" FantasyTeam : owns
    FantasyTeam "1" --> "0..*" FantasyTeamPlayer : contains
    FavoriteTeam ..> Team : references (external id)
    FavoritePlayer ..> Player : references (external id)
    FantasyTeamPlayer ..> Player : references (external id)
    Match ..> Team : plays between
```

**Explanation:** `User` is the aggregate root for all personalized data and owns
collections of favorites and fantasy teams. `Team`, `Player`, and `Match` are external
(API-Football) reference types — the app stores only the id plus a denormalized snapshot
(name/logo/photo) so favorites render without an extra API round-trip.

---

## 3. Entity-Relationship Diagram (ERD)

Physical database design matching `backend/prisma/schema.prisma`.

```mermaid
erDiagram
    USER ||--o{ FAVORITE_TEAM : has
    USER ||--o{ FAVORITE_PLAYER : has
    USER ||--o{ FANTASY_TEAM : has
    FANTASY_TEAM ||--o{ FANTASY_TEAM_PLAYER : includes

    USER {
        string id PK
        string email UK
        string password
        string name
        string avatar
        datetime createdAt
    }

    FAVORITE_TEAM {
        string id PK
        string userId FK
        int teamId
        string teamName
        string teamLogo
        datetime createdAt
    }

    FAVORITE_PLAYER {
        string id PK
        string userId FK
        int playerId
        string playerName
        string playerPhoto
        datetime createdAt
    }

    FANTASY_TEAM {
        string id PK
        string userId FK
        string name
        datetime createdAt
    }

    FANTASY_TEAM_PLAYER {
        string id PK
        string fantasyTeamId FK
        int playerId
        string position
    }
```

**Explanation:** All relationships are one-to-many from `USER`. `FAVORITE_TEAM` and
`FAVORITE_PLAYER` carry a composite unique constraint `(userId, teamId)` /
`(userId, playerId)` so a user cannot favorite the same entity twice. Deleting a user
cascades to their favorites and fantasy teams; deleting a fantasy team cascades to its
players.
