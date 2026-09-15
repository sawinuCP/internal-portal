import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BCRYPT_COST = 12;

// Demo credentials for the take-home reviewer — documented in the README.
const DEMO_USERS = [
  { name: "Amara Silva", email: "amara@portal.dev", password: "Password123!" },
  { name: "Dilan Perera", email: "dilan@portal.dev", password: "Password123!" },
];

const DEMO_ANNOUNCEMENTS = [
  {
    title: "Welcome to the portal",
    body: "This is our new team home base. Announcements posted here show up for everyone — try posting one!",
  },
  {
    title: "Standup moves to 10:00",
    body: "Daily standup shifts to 10:00 starting Monday. Same link, ten minutes earlier.",
  },
];

async function main() {
  for (const user of DEMO_USERS) {
    const passwordHash = await hash(user.password, BCRYPT_COST);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {}, // never overwrite an existing password on re-seed
      create: { name: user.name, email: user.email, passwordHash },
    });
  }

  const author = await prisma.user.findUnique({ where: { email: DEMO_USERS[0].email } });
  const announcementCount = await prisma.announcement.count();

  if (author && announcementCount === 0) {
    await prisma.announcement.createMany({
      data: DEMO_ANNOUNCEMENTS.map((announcement) => ({
        ...announcement,
        authorId: author.id,
      })),
    });
  }

  console.log("Seed complete. Demo logins:");
  for (const user of DEMO_USERS) {
    console.log(`  ${user.email} / ${user.password}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
