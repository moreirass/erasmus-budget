import {ShoppingCart,Coffee,UtensilsCrossed,WashingMachine,PartyPopper,WalletCards,Plane,Train,BedDouble,Ticket,MapPin} from 'lucide-react';
import type {Category,Transaction} from './model';
export const categoryInfo:Record<Category,{description:string;icon:typeof ShoppingCart}>={
 groceries:{description:'Compras de supermercado e produtos de higiene',icon:ShoppingCart},
 snacks:{description:'Cafés, lanches e máquinas de vending',icon:Coffee},
 restaurants:{description:'Refeições completas e cantina',icon:UtensilsCrossed},
 laundry:{description:'Carregamentos do cartão da residência',icon:WashingMachine},
 nightlife:{description:'Saídas, bares e momentos de convívio',icon:PartyPopper},
 other:{description:'Compras e despesas pessoais diversas',icon:WalletCards},
 travel:{description:'Transportes, alojamento, comida e atividades',icon:Plane},
};
export function CategoryIcon({category,travelType}:{category:Category;travelType?:Transaction['travelType']}){const Icon=category==='travel'?({transport:Train,accommodation:BedDouble,food:UtensilsCrossed,activities:Ticket,unclassified:MapPin}[travelType??'unclassified']):categoryInfo[category].icon;return <Icon size={21} strokeWidth={1.8}/>;}
