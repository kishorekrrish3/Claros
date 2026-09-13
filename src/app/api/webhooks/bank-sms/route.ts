import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseIndianBankSMS } from "@/lib/bank-sms-parser";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const smsText = body.smsText || body.text || body.message || body.body;

    if (!smsText) {
      return NextResponse.json({ error: "Missing smsText payload" }, { status: 400 });
    }

    const parsed = parseIndianBankSMS(smsText);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not extract valid bank transaction details from SMS" },
        { status: 422 }
      );
    }

    // Get or create general category
    let category = await db.category.findFirst({
      where: { active: true },
    });

    if (!category) {
      category = await db.category.create({
        data: {
          name: "General",
          color: "#6366f1",
        },
      });
    }

    // Save transaction to database
    const transaction = await db.transaction.create({
      data: {
        amount: parsed.amount,
        merchant: parsed.merchant,
        categoryId: category.id,
        date: new Date(),
        essential: parsed.type === "expense" && parsed.merchant.toLowerCase().includes("atm"),
        type: parsed.type,
        note: `Live Auto-Synced via ${parsed.bankName} (${parsed.accountNumber || "SMS"})`,
      },
    });

    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/insights");

    return NextResponse.json({
      success: true,
      message: "Transaction logged successfully",
      parsed,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error("Bank SMS Webhook Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
