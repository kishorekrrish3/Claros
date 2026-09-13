"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  logo: string;
  connected: boolean;
  lastSynced: string | null;
  balance: number;
}

// Pre-defined or stored bank accounts
let MOCK_CONNECTED_BANKS: BankAccount[] = [
  {
    id: "sbi-01",
    bankName: "State Bank of India (SBI)",
    accountType: "Savings Account",
    accountNumber: "•••• 4821",
    logo: "🏛️",
    connected: true,
    lastSynced: new Date().toISOString(),
    balance: 45280,
  },
  {
    id: "icici-01",
    bankName: "ICICI Bank",
    accountType: "Salary Account",
    accountNumber: "•••• 9102",
    logo: "🏦",
    connected: true,
    lastSynced: new Date().toISOString(),
    balance: 82150,
  },
  {
    id: "hdfc-01",
    bankName: "HDFC Bank",
    accountType: "Credit Card / Savings",
    accountNumber: "•••• 1142",
    logo: "💳",
    connected: false,
    lastSynced: null,
    balance: 0,
  },
];

export async function getConnectedBankAccounts(): Promise<BankAccount[]> {
  return MOCK_CONNECTED_BANKS;
}

export async function triggerLiveBankSync(bankId: string) {
  const bank = MOCK_CONNECTED_BANKS.find((b) => b.id === bankId);
  if (!bank) throw new Error("Bank account not found");

  // Get or create uncategorized/general category
  let defaultCategory = await db.category.findFirst({
    where: { active: true },
  });

  if (!defaultCategory) {
    defaultCategory = await db.category.create({
      data: {
        name: "General",
        color: "#6366f1",
      },
    });
  }

  // Generate realistic recent live transactions from SBI/ICICI
  const now = new Date();
  const sampleTransactions = bankId.includes("sbi")
    ? [
        {
          merchant: "SBI UPI - Swiggy Food",
          amount: 340,
          type: "expense",
          essential: false,
        },
        {
          merchant: "SBI ATM Cash Withdrawal",
          amount: 2000,
          type: "expense",
          essential: true,
        },
        {
          merchant: "SBI Interest Credit",
          amount: 450,
          type: "income",
          essential: false,
        },
      ]
    : [
        {
          merchant: "ICICI iMobile - Uber India",
          amount: 280,
          type: "expense",
          essential: false,
        },
        {
          merchant: "ICICI Salary Credit",
          amount: 65000,
          type: "income",
          essential: true,
        },
        {
          merchant: "ICICI Amazon Pay",
          amount: 1499,
          type: "expense",
          essential: false,
        },
      ];

  // Pick one live transaction randomly to simulate real bank webhooks
  const selectedTx = sampleTransactions[Math.floor(Math.random() * sampleTransactions.length)];

  await db.transaction.create({
    data: {
      amount: selectedTx.amount,
      merchant: selectedTx.merchant,
      categoryId: defaultCategory.id,
      date: now,
      essential: selectedTx.essential,
      type: selectedTx.type,
      note: `Live Synced via ${bank.bankName}`,
    },
  });

  // Update last synced time
  bank.lastSynced = now.toISOString();
  bank.connected = true;

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/insights");

  return {
    success: true,
    syncedTransaction: selectedTx,
    lastSynced: bank.lastSynced,
  };
}

export async function toggleBankConnection(bankId: string, connect: boolean) {
  const bank = MOCK_CONNECTED_BANKS.find((b) => b.id === bankId);
  if (bank) {
    bank.connected = connect;
    if (connect) {
      bank.lastSynced = new Date().toISOString();
    }
  }
  revalidatePath("/");
  return { success: true, connected: connect };
}
