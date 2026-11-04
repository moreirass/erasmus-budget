import {
  BedDouble,
  Coffee,
  MapPin,
  PartyPopper,
  Plane,
  ShoppingCart,
  Ticket,
  Train,
  UtensilsCrossed,
  WalletCards,
  WashingMachine,
} from "lucide-react";
import type { Category, Transaction } from "./model";
export const categoryInfo: Record<
  Category,
  { description: string; icon: typeof ShoppingCart }
> = {
  groceries: {
    description: "Groceries and hygiene products",
    icon: ShoppingCart,
  },
  snacks: { description: "Coffee, snacks and vending machines", icon: Coffee },
  restaurants: {
    description: "Full meals and canteen",
    icon: UtensilsCrossed,
  },
  laundry: {
    description: "Residence laundry card top-ups",
    icon: WashingMachine,
  },
  nightlife: {
    description: "Nights out, bars and social activities",
    icon: PartyPopper,
  },
  other: {
    description: "Other purchases and personal expenses",
    icon: WalletCards,
  },
  travel: {
    description: "Transport, accommodation, food and activities",
    icon: Plane,
  },
};
export function CategoryIcon({
  category,
  travelType,
}: {
  category: Category;
  travelType?: Transaction["travelType"];
}) {
  const Icon =
    category === "travel"
      ? {
          transport: Train,
          accommodation: BedDouble,
          food: UtensilsCrossed,
          activities: Ticket,
          unclassified: MapPin,
        }[travelType ?? "unclassified"]
      : categoryInfo[category].icon;
  return <Icon size={21} strokeWidth={1.8} />;
}
