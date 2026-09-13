import { PrismaClient } from "@prisma/client";
import { addDays, subDays, startOfMonth, format } from "date-fns";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", type: "expense", color: "#f97316", icon: "utensils" },
  { name: "Groceries", type: "expense", color: "#84cc16", icon: "shopping-cart" },
  { name: "Transport", type: "expense", color: "#3b82f6", icon: "car" },
  { name: "Housing", type: "expense", color: "#6366f1", icon: "home" },
  { name: "Utilities", type: "expense", color: "#06b6d4", icon: "zap" },
  { name: "Entertainment", type: "expense", color: "#a855f7", icon: "film" },
  { name: "Shopping", type: "expense", color: "#ec4899", icon: "shopping-bag" },
  { name: "Health", type: "expense", color: "#ef4444", icon: "heart" },
  { name: "Salary", type: "income", color: "#22c55e", icon: "briefcase" },
  { name: "Freelance", type: "income", color: "#10b981", icon: "laptop" },
  { name: "Investments", type: "income", color: "#059669", icon: "trending-up" },
];

async function main() {
  console.log("Cleaning up database...");
  await prisma.savingsContribution.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.monthlyOverride.deleteMany();
  await prisma.dayMetadata.deleteMany();
  await prisma.monthlySnapshot.deleteMany();
  await prisma.savingsGoal.deleteMany();
  await prisma.savingsAllocation.deleteMany();
  await prisma.fixedExpense.deleteMany();
  await prisma.incomeSource.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userSettings.deleteMany();

  console.log("Seeding UserSettings...");
  await prisma.userSettings.create({
    data: {
      currency: "INR",
      monthlyBudget: 50000,
      theme: "system",
      includeTodayInDays: true,
      rolloverEnabled: false,
    },
  });

  console.log("Seeding Categories...");
  const categories = [];
  for (const cat of DEFAULT_CATEGORIES) {
    const c = await prisma.category.create({ data: cat });
    categories.push(c);
  }

  console.log("Seeding Income Sources...");
  await prisma.incomeSource.createMany({
    data: [
      { name: "Salary", amount: 45000, active: true },
      { name: "Freelance", amount: 15000, active: true },
      { name: "Interest", amount: 500, active: true },
    ],
  });

  console.log("Seeding Fixed Expenses...");
  await prisma.fixedExpense.createMany({
    data: [
      { name: "Rent", amount: 12000, dayOfMonth: 1, active: true, category: "Housing" },
      { name: "Electricity", amount: 1500, dayOfMonth: 5, active: true, category: "Utilities" },
      { name: "Internet", amount: 800, dayOfMonth: 7, active: true, category: "Utilities" },
      { name: "Phone", amount: 499, dayOfMonth: 10, active: true, category: "Utilities" },
      { name: "Insurance", amount: 2000, dayOfMonth: 15, active: true, category: "Health" },
      { name: "Subscriptions", amount: 500, dayOfMonth: 1, active: true, category: "Entertainment" },
      { name: "Gym", amount: 1200, dayOfMonth: 1, active: true, category: "Health" },
      { name: "Transport Pass", amount: 1500, dayOfMonth: 1, active: true, category: "Transport" },
    ],
  });

  console.log("Seeding Savings Allocations...");
  await prisma.savingsAllocation.createMany({
    data: [
      { name: "Emergency Fund", amount: 5000, type: "fixed" },
      { name: "Vacation Fund", amount: 3000, type: "fixed" },
    ],
  });

  console.log("Seeding Savings Goals...");
  const goals = await Promise.all([
    prisma.savingsGoal.create({
      data: {
        name: "Emergency Fund",
        targetAmount: 200000,
        currentAmount: 85000,
        monthlyContribution: 5000,
        targetDate: new Date("2027-12-31"),
        color: "#f59e0b",
      }
    }),
    prisma.savingsGoal.create({
      data: {
        name: "Europe Trip",
        targetAmount: 150000,
        currentAmount: 42000,
        monthlyContribution: 3000,
        targetDate: new Date("2027-06-30"),
        color: "#3b82f6",
      }
    }),
    prisma.savingsGoal.create({
      data: {
        name: "New Laptop",
        targetAmount: 80000,
        currentAmount: 25000,
        monthlyContribution: 4000,
        targetDate: new Date("2027-03-31"),
        color: "#ec4899",
      }
    }),
  ]);

  console.log("Seeding Transactions...");
  const today = new Date();
  
  const foodCat = categories.find(c => c.name === "Food & Dining");
  const groceriesCat = categories.find(c => c.name === "Groceries");
  const transportCat = categories.find(c => c.name === "Transport");

  const transactions = [];

  // Generate for last 60 days
  for (let i = 0; i < 60; i++) {
    const d = subDays(today, i);
    
    // Coffee (most days)
    if (Math.random() > 0.3) {
      transactions.push({
        date: d,
        amount: Math.floor(Math.random() * 100) + 50,
        merchant: "Local Cafe",
        categoryId: foodCat?.id,
        essential: false,
        satisfaction: "fine",
        type: "expense",
      });
    }

    // Lunch (weekdays mostly)
    if (d.getDay() > 0 && d.getDay() < 6 && Math.random() > 0.4) {
      transactions.push({
        date: d,
        amount: Math.floor(Math.random() * 150) + 150,
        merchant: "Office Canteen",
        categoryId: foodCat?.id,
        essential: true,
        type: "expense",
      });
    }

    // Groceries (once a week)
    if (d.getDay() === 0) {
      transactions.push({
        date: d,
        amount: Math.floor(Math.random() * 700) + 800,
        merchant: "Supermarket",
        categoryId: groceriesCat?.id,
        essential: true,
        type: "expense",
      });
    }

    // Transport (most days)
    if (Math.random() > 0.2) {
      transactions.push({
        date: d,
        amount: Math.floor(Math.random() * 150) + 50,
        merchant: "Uber/Ola/Metro",
        categoryId: transportCat?.id,
        essential: true,
        type: "expense",
      });
    }
  }

  await prisma.transaction.createMany({
    data: transactions
  });

  console.log("Seeding Savings Contributions...");
  const contributions = [];
  for (const goal of goals) {
    for (let i = 1; i <= 3; i++) {
      contributions.push({
        goalId: goal.id,
        amount: goal.monthlyContribution,
        date: subDays(today, i * 30),
        note: "Monthly Auto-save",
      });
    }
  }
  await prisma.savingsContribution.createMany({ data: contributions });

  console.log("Seeding Day Metadata...");
  const dayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  await prisma.dayMetadata.create({
    data: {
      date: dayDate,
      note: "Payday!",
      emoji: "🎉",
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
