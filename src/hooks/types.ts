import type { Data } from "../model";
import type { useBudget } from "../store";
export type BudgetStore = ReturnType<typeof useBudget>;
export type Commit = (data: Data, message?: string) => boolean;
