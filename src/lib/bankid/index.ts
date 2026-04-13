import { config } from "@/lib/config";
import { liveBankIdClient } from "./live";
import { mockBankIdClient } from "./mock";
import type { BankIdClient } from "./types";

export function bankid(): BankIdClient {
  return config.mode === "live" ? liveBankIdClient : mockBankIdClient;
}

export type { BankIdClient } from "./types";
