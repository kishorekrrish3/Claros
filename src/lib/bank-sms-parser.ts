/**
 * Intelligent parser for Indian Bank SMS notifications (SBI, ICICI, HDFC, Axis, etc.)
 */

export interface ParsedBankSMS {
  bankName: string;
  amount: number;
  type: "expense" | "income" | "transfer";
  merchant: string;
  accountNumber: string | null;
  rawText: string;
}

export function parseIndianBankSMS(smsText: string): ParsedBankSMS | null {
  if (!smsText || typeof smsText !== "string") return null;

  const cleanText = smsText.trim();
  const lower = cleanText.toLowerCase();

  // Detect Bank Name
  let bankName = "Bank";
  if (lower.includes("sbi") || lower.includes("state bank")) {
    bankName = "State Bank of India (SBI)";
  } else if (lower.includes("icici")) {
    bankName = "ICICI Bank";
  } else if (lower.includes("hdfc")) {
    bankName = "HDFC Bank";
  } else if (lower.includes("axis")) {
    bankName = "Axis Bank";
  } else if (lower.includes("kotak")) {
    bankName = "Kotak Mahindra Bank";
  } else if (lower.includes("paytm")) {
    bankName = "Paytm Payments Bank";
  }

  // Detect Amount (Rs, INR, ₹ followed by numbers)
  const amountMatch = cleanText.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
                      cleanText.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i);

  if (!amountMatch) return null;

  const rawAmountStr = amountMatch[1].replace(/,/g, "");
  const amount = parseFloat(rawAmountStr);
  if (isNaN(amount) || amount <= 0) return null;

  // Detect Type (Expense vs Income vs Transfer)
  let type: "expense" | "income" | "transfer" = "expense";
  if (lower.includes("credited") || lower.includes("received") || lower.includes("deposited") || lower.includes("credit")) {
    type = "income";
  } else if (lower.includes("debited") || lower.includes("paid") || lower.includes("spent") || lower.includes("sent") || lower.includes("debit")) {
    type = "expense";
  } else if (lower.includes("transferred") || lower.includes("trf")) {
    type = "transfer";
  }

  // Extract Account Number (e.g. A/c XX4821 or A/c ending 9102)
  const accMatch = cleanText.match(/(?:a\/c|account|card)\s*(?:no\.?)?\s*(?:X*|[\*\.\s]*)([\d]{3,4})/i);
  const accountNumber = accMatch ? `•••• ${accMatch[1]}` : null;

  // Extract Merchant / Payee
  let merchant = "Bank Transaction";
  
  // UPI Pattern: UPI/Swiggy/VPA or to VPA swiggy@icici or at Swiggy
  const upiMatch = cleanText.match(/(?:to|at|vpa|info|for)\s+([a-zA-Z0-9\s&\.\-_]+?)(?:\s+on|\s+ref|\s+avail|\s+a\/c|\.|$)/i) ||
                   cleanText.match(/upi\/[^\/]+\/([^\/]+)/i);

  if (upiMatch && upiMatch[1]) {
    const extracted = upiMatch[1].trim();
    if (extracted.length > 2 && !extracted.toLowerCase().includes("your") && !extracted.toLowerCase().includes("bank")) {
      merchant = extracted;
    }
  }

  // Fallback merchant cleanup
  if (merchant === "Bank Transaction") {
    if (lower.includes("swiggy")) merchant = "Swiggy";
    else if (lower.includes("zomato")) merchant = "Zomato";
    else if (lower.includes("uber")) merchant = "Uber";
    else if (lower.includes("amazon")) merchant = "Amazon";
    else if (lower.includes("flipkart")) merchant = "Flipkart";
    else if (lower.includes("atm")) merchant = "ATM Cash Withdrawal";
    else if (lower.includes("salary")) merchant = "Salary Credit";
    else merchant = `${bankName} ${type === "income" ? "Credit" : "Debit"}`;
  }

  return {
    bankName,
    amount,
    type,
    merchant,
    accountNumber,
    rawText: cleanText,
  };
}
