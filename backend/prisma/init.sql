-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "football";

-- CreateTable
CREATE TABLE "football"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football"."favorite_teams" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamLogo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football"."favorite_players" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,
    "playerName" TEXT NOT NULL,
    "playerPhoto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football"."fantasy_teams" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fantasy_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football"."fantasy_team_players" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,
    "position" TEXT NOT NULL,

    CONSTRAINT "fantasy_team_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "football"."users"("email");

-- CreateIndex
CREATE INDEX "favorite_teams_userId_idx" ON "football"."favorite_teams"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_teams_userId_teamId_key" ON "football"."favorite_teams"("userId", "teamId");

-- CreateIndex
CREATE INDEX "favorite_players_userId_idx" ON "football"."favorite_players"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_players_userId_playerId_key" ON "football"."favorite_players"("userId", "playerId");

-- CreateIndex
CREATE INDEX "fantasy_teams_userId_idx" ON "football"."fantasy_teams"("userId");

-- CreateIndex
CREATE INDEX "fantasy_team_players_fantasyTeamId_idx" ON "football"."fantasy_team_players"("fantasyTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "fantasy_team_players_fantasyTeamId_playerId_key" ON "football"."fantasy_team_players"("fantasyTeamId", "playerId");

-- AddForeignKey
ALTER TABLE "football"."favorite_teams" ADD CONSTRAINT "favorite_teams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "football"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football"."favorite_players" ADD CONSTRAINT "favorite_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "football"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football"."fantasy_teams" ADD CONSTRAINT "fantasy_teams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "football"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football"."fantasy_team_players" ADD CONSTRAINT "fantasy_team_players_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "football"."fantasy_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

