mkdir -p real-alpha-shylock-backend
cd real-alpha-shylock-backend

cat > package.json <<'EOF'
{
  "name": "real-alpha-shylock-backend",
  "version": "1.0.0",
  "private": true,
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.12.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.9.0",
    "dotenv": "^16.0.0",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.3",
    "@types/cors": "^2.9.0",
    "@types/express": "^4.17.0",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/node": "^20.12.12",
    "prisma": "^5.12.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.2.0",
    "typescript": "^5.5.4"
  }
}
EOF

cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts", "prisma/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > .gitignore <<'EOF'
node_modules
dist
.env
.env.local
prisma/dev.db
prisma/dev.db-journal
npm-debug.log*
EOF

cat > .env.example <<'EOF'
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="replace_with_a_long_random_string"
PORT=5000
FRONTEND_URL="http://localhost:3000"
EOF

mkdir -p src/controllers src/routes src/middleware src/lib prisma

cat > prisma/schema.prisma <<'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String
  role        String   @default("customer")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  applications LoanApplication[]
}

model LoanApplication {
  id             String   @id @default(cuid())
  fullName       String
  email          String
  phone          String
  idNumber       String
  loanAmount     Int
  loanType       String
  maritalStatus  String
  spouseName     String?
  guarantorName  String
  guarantorPhone String
  purposeDetails String
  status         String   @default("Pending")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  userId         String?
  user           User?    @relation(fields: [userId], references: [id])
}
EOF

cat > prisma/seed.ts <<'EOF'
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@alphaloan.co.ke";

  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash("admin123", 10);

    await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        role: "admin"
      }
    });

    console.log("Admin user created.");
  } else {
    console.log("Admin already exists.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

cat > src/lib/prisma.ts <<'EOF'
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
EOF

cat > src/lib/jwt.ts <<'EOF'
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as any;
}
EOF

cat > src/middleware/authMiddleware.ts <<'EOF'
import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}
EOF

cat > src/controllers/authController.ts <<'EOF'
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";

export async function registerUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        role: "customer"
      }
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Registration failed" });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed" });
  }
}
EOF

cat > src/controllers/applicationController.ts <<'EOF'
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function createApplication(req: Request, res: Response) {
  try {
    const {
      fullName,
      email,
      phone,
      idNumber,
      loanAmount,
      loanType,
      maritalStatus,
      spouseName,
      guarantorName,
      guarantorPhone,
      purposeDetails
    } = req.body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !idNumber ||
      !loanAmount ||
      !loanType ||
      !maritalStatus ||
      !guarantorName ||
      !guarantorPhone ||
      !purposeDetails
    ) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    const application = await prisma.loanApplication.create({
      data: {
        fullName,
        email,
        phone,
        idNumber,
        loanAmount: Number(loanAmount),
        loanType,
        maritalStatus,
        spouseName: spouseName || "",
        guarantorName,
        guarantorPhone,
        purposeDetails,
        status: "Pending"
      }
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      application
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to submit application" });
  }
}

export async function getAllApplications(req: Request, res: Response) {
  try {
    const applications = await prisma.loanApplication.findMany({
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({ applications });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch applications" });
  }
}

export async function updateApplicationStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const updated = await prisma.loanApplication.update({
      where: { id },
      data: { status }
    });

    return res.status(200).json({
      message: "Application status updated",
      application: updated
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update application status" });
  }
}
EOF

cat > src/controllers/adminController.ts <<'EOF'
import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { prisma } from "../lib/prisma";

export async function getDashboardData(req: AuthRequest, res: Response) {
  try {
    const applications = await prisma.loanApplication.findMany({
      orderBy: { createdAt: "desc" }
    });

    return res.status(200).json({
      user: req.user,
      totalApplications: applications.length,
      pending: applications.filter((item) => item.status === "Pending").length,
      approved: applications.filter((item) => item.status === "Approved").length,
      rejected: applications.filter((item) => item.status === "Rejected").length,
      applications
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
}
EOF

cat > src/routes/authRoutes.ts <<'EOF'
import { Router } from "express";
import { loginUser, registerUser } from "../controllers/authController";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;
EOF

cat > src/routes/applicationRoutes.ts <<'EOF'
import { Router } from "express";
import { createApplication } from "../controllers/applicationController";

const router = Router();

router.post("/", createApplication);

export default router;
EOF

cat > src/routes/adminRoutes.ts <<'EOF'
import { Router } from "express";
import { getDashboardData } from "../controllers/adminController";
import { requireAdmin, requireAuth } from "../middleware/authMiddleware";
import { getAllApplications, updateApplicationStatus } from "../controllers/applicationController";

const router = Router();

router.get("/dashboard", requireAuth, requireAdmin, getDashboardData);
router.get("/applications", requireAuth, requireAdmin, getAllApplications);
router.patch("/applications/:id/status", requireAuth, requireAdmin, updateApplicationStatus);

export default router;
EOF

cat > src/app.ts <<'EOF'
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import adminRoutes from "./routes/adminRoutes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    app: "Real Alpha Shylock Loan API",
    status: "running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);

export default app;
EOF

cat > src/server.ts <<'EOF'
import app from "./app";

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
EOF

cat > README.md <<'EOF'
# Real Alpha Shylock Loan Backend

This is the backend API for the Real Alpha Shylock Loan portal.

## Features
- User registration
- User login
- JWT authentication
- Loan application submission
- Admin dashboard data
- Admin status approval/rejection

## Stack
- Node.js
- Express
- TypeScript
- Prisma
- SQLite for local development

## Setup
1. Install dependencies:
   npm install

2. Copy env file:
   cp .env.example .env

3. Generate Prisma client:
   npx prisma generate

4. Run migrations:
   npx prisma migrate dev --name init

5. Seed admin user:
   npm run prisma:seed

6. Start dev server:
   npm run dev

## Default admin
- Email: admin@alphaloan.co.ke
- Password: admin123

## API
- POST /api/auth/register
- POST /api/auth/login
- POST /api/applications
- GET /api/admin/applications
- PATCH /api/admin/applications/:id/status

## Production note
For production, switch DATABASE_URL to PostgreSQL and update FRONTEND_URL.
EOF

printf '\nBackend repo created successfully.\n'
printf 'Run these commands next:\n'
printf 'npm install\ncp .env.example .env\nnpx prisma generate\nnpx prisma migrate dev --name init\nnpm run prisma:seed\nnpm run dev\n'
