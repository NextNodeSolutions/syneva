CREATE TABLE "user" (
 "id" TEXT PRIMARY KEY NOT NULL,
 "name" TEXT NOT NULL,
 "email" TEXT NOT NULL UNIQUE,
 "emailVerified" INTEGER NOT NULL DEFAULT 0,
 "image" TEXT,
 "createdAt" date NOT NULL,
 "updatedAt" date NOT NULL
);

CREATE TABLE "session" (
 "id" TEXT PRIMARY KEY NOT NULL,
 "expiresAt" date NOT NULL,
 "token" TEXT NOT NULL UNIQUE,
 "createdAt" date NOT NULL,
 "updatedAt" date NOT NULL,
 "ipAddress" TEXT,
 "userAgent" TEXT,
 "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);
CREATE INDEX "session_userId" ON "session" ("userId");

CREATE TABLE "account" (
 "id" TEXT PRIMARY KEY NOT NULL,
 "accountId" TEXT NOT NULL,
 "providerId" TEXT NOT NULL,
 "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
 "accessToken" TEXT,
 "refreshToken" TEXT,
 "idToken" TEXT,
 "accessTokenExpiresAt" date,
 "refreshTokenExpiresAt" date,
 "scope" TEXT,
 "password" TEXT,
 "createdAt" date NOT NULL,
 "updatedAt" date NOT NULL,
 UNIQUE ("providerId", "accountId")
);
CREATE INDEX "account_userId" ON "account" ("userId");

CREATE TABLE "verification" (
 "id" TEXT PRIMARY KEY NOT NULL,
 "identifier" TEXT NOT NULL,
 "value" TEXT NOT NULL,
 "expiresAt" date NOT NULL,
 "createdAt" date NOT NULL,
 "updatedAt" date NOT NULL
);
CREATE INDEX "verification_identifier" ON "verification" ("identifier");

CREATE TABLE "rateLimit" (
 "id" TEXT PRIMARY KEY NOT NULL,
 "key" TEXT NOT NULL UNIQUE,
 "count" INTEGER NOT NULL,
 "lastRequest" INTEGER NOT NULL
);

CREATE TABLE "linkedProject" (
 "userId" TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
 "repositoryId" INTEGER NOT NULL,
 PRIMARY KEY ("userId", "repositoryId")
);
