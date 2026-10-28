export const categories = [
  {id:'groceries',name:'Groceries',icon:'🥑',color:'#60886a',limit:17000},
  {id:'restaurants',name:'Restaurants',icon:'🍜',color:'#d9a65d',limit:4000},
  {id:'laundry',name:'Laundry',icon:'🫧',color:'#7daab1',limit:5500},
  {id:'nightlife',name:'Nightlife',icon:'✨',color:'#9a89b8',limit:8000},
  {id:'travel',name:'Travel',icon:'🚆',color:'#517f9e',limit:15000},
  {id:'other',name:'Hygiene & other',icon:'🧴',color:'#bd8d7c',limit:2500},
  {id:'emergency',name:'Emergency',icon:'🛟',color:'#b5a056',limit:3000},
  {id:'lodging',name:'Lodging',icon:'🏠',color:'#9baba5',limit:0},
  {id:'transport',name:'Local transport',icon:'🚋',color:'#a4b6bd',limit:0},
] as const;
export type Category = typeof categories[number]['id'];
export type Plan = {budget:number; limits:Record<Category,number>};
export type Transaction = {id:string;date:string;kind:'expense'|'topup'|'wash';category:Category;amount:number;currency:'EUR'|'CZK';rate:number;eur:number;credit:number;note:string};
export type Data = {version:1;settings:{start:string;end:string;rate:number|null;openingCard:number;openingTravel:number;openingEmergency:number};plans:Record<string,Plan>;transactions:Transaction[]};
export const defaultPlan = ():Plan => ({budget:55000,limits:Object.fromEntries(categories.map(c=>[c.id,c.limit])) as Plan['limits']});
export const freshData = ():Data => ({version:1,settings:{start:'2026-11',end:'2027-01',rate:null,openingCard:0,openingTravel:0,openingEmergency:0},plans:{'2026-11':defaultPlan()},transactions:[]});
export const money = (cents:number,currency='EUR') => new Intl.NumberFormat('en-IE',{style:'currency',currency,maximumFractionDigits:2}).format(cents/100);
export const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function monthLabel(m:string){return new Date(m+'-15T12:00:00').toLocaleDateString('en-GB',{month:'long',year:'numeric'});}
export function months(start:string,end:string){const result:string[]=[];let [y,m]=start.split('-').map(Number);while(`${y}-${String(m).padStart(2,'0')}`<=end && result.length<120){result.push(`${y}-${String(m).padStart(2,'0')}`);if(++m>12){y++;m=1;}}return result;}
export const lastDay = (m:string) => new Date(Number(m.slice(0,4)),Number(m.slice(5)),0).getDate();
export const monthEnd = (m:string) => `${m}-${lastDay(m)}`;
export function planFor(d:Data,m:string):Plan {const key=Object.keys(d.plans).filter(k=>k<=m).sort().at(-1);return key?d.plans[key]:defaultPlan();}
export function weeks(m:string){const n=lastDay(m);const out:{start:string;end:string;days:number}[]=[];let day=1;while(day<=n){const dow=new Date(`${m}-${String(day).padStart(2,'0')}T12:00:00`).getDay();const end=Math.min(n,day+(7-(dow||7)));out.push({start:`${m}-${String(day).padStart(2,'0')}`,end:`${m}-${String(end).padStart(2,'0')}`,days:end-day+1});day=end+1;}return out;}
export function summary(d:Data,m:string,range?:{start:string;end:string;days:number}){
 const start=range?.start??m+'-01',end=range?.end??monthEnd(m),p=planFor(d,m);
 const rows=d.transactions.filter(t=>t.date>=start&&t.date<=end);
 const spent=Object.fromEntries(categories.map(c=>[c.id,rows.filter(t=>t.category===c.id&&t.kind!=='wash').reduce((s,t)=>s+t.eur,0)])) as Record<Category,number>;
 const fund=(category:'travel'|'emergency')=>(category==='travel'?d.settings.openingTravel:d.settings.openingEmergency)+months(d.settings.start,m<d.settings.end?m:d.settings.end).reduce((s,month)=>s+planFor(d,month).limits[category],0)-d.transactions.filter(t=>t.date<=end&&t.category===category&&t.kind==='expense').reduce((s,t)=>s+t.eur,0);
 const card=d.settings.openingCard+d.transactions.filter(t=>t.date<=end).reduce((s,t)=>s+(t.kind==='topup'?t.credit:t.kind==='wash'?-t.credit:0),0);
 const cash=Object.values(spent).reduce((a,b)=>a+b,0);
 const fraction=range?range.days/lastDay(m):1;
 const everyday=categories.filter(c=>!['travel','emergency'].includes(c.id)).reduce((s,c)=>s+spent[c.id],0);
 return {rows,spent,cash,card,travel:fund('travel'),emergency:fund('emergency'),wash:rows.filter(t=>t.kind==='wash').reduce((s,t)=>s+t.credit,0),everydayRemaining:Math.round((p.budget-p.limits.travel-p.limits.emergency)*fraction)-everyday,budget:Math.round(p.budget*fraction)};
}
export function makeTransaction(input:Omit<Transaction,'eur'|'credit'>):Transaction {
 const eur=input.currency==='EUR'?input.amount:Math.round(input.amount/input.rate);
 const credit=input.kind==='expense'?0:input.currency==='CZK'?input.amount:Math.round(input.amount*input.rate);
 return {...input,eur,credit};
}
const monthValid=(s:unknown):s is string=>typeof s==='string'&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(s);
const nonnegative=(n:unknown):n is number=>Number.isSafeInteger(n)&&Number(n)>=0&&Number(n)<=100000000;
const fail=(message:string):never=>{throw new Error(message);};
export function validateData(value:unknown):Data {
 const d=value as Data;
 if(!d||d.version!==1||!d.settings||!d.plans||!Array.isArray(d.transactions))fail('This is not a Pocket v1 backup.');
 const s=d.settings;
 if(!monthValid(s.start)||!monthValid(s.end)||s.start>s.end||months(s.start,s.end).length>=120)fail('Choose a valid tracking period shorter than 10 years.');
 if(s.rate!==null&&(!Number.isFinite(s.rate)||s.rate<=0||s.rate>1000))fail('Exchange rate must be between 0 and 1000 CZK per EUR.');
 if(![s.openingCard,s.openingTravel,s.openingEmergency].every(nonnegative))fail('Opening balances must be non-negative amounts.');
 if(Object.keys(d.plans).length===0)fail('At least one budget plan is required.');
 for(const [m,p] of Object.entries(d.plans)){
  if(!monthValid(m)||!p||!p.limits||!nonnegative(p.budget)||!categories.every(c=>nonnegative(p.limits[c.id])))fail('Invalid monthly limits.');
  if(categories.reduce((a,c)=>a+p.limits[c.id],0)!==p.budget)fail('Category allocations must add up to your monthly budget.');
 }
 if(d.transactions.length>100000)fail('Backup is too large.');
 const ids=new Set<string>();
 for(const t of d.transactions){
  if(!t||typeof t.id!=='string'||!t.id||t.id.length>100||ids.has(t.id))fail('Transactions need unique IDs.');ids.add(t.id);
  if(typeof t.date!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(t.date)||!monthValid(t.date.slice(0,7))||Number(t.date.slice(8))<1||Number(t.date.slice(8))>lastDay(t.date.slice(0,7))||t.date<s.start+'-01'||t.date>monthEnd(s.end))fail('A transaction date falls outside the tracking period or is invalid.');
  if(!['expense','topup','wash'].includes(t.kind)||!categories.some(c=>c.id===t.category)||!['EUR','CZK'].includes(t.currency)||!nonnegative(t.amount)||!t.amount||!Number.isFinite(t.rate)||t.rate<=0||t.rate>1000||typeof t.note!=='string'||t.note.length>500)fail('Invalid transaction fields.');
  if((t.kind!=='expense'&&t.category!=='laundry')||(t.kind==='expense'&&t.category==='laundry'))fail('Laundry must be a top-up or wash.');
  const rebuilt=makeTransaction(t);
  if(!nonnegative(t.eur)||!nonnegative(t.credit)||t.eur!==rebuilt.eur||t.credit!==rebuilt.credit)fail('Transaction conversion does not match its saved rate.');
 }
 let card=s.openingCard;
 // Credit is checked by date; top-ups precede washes on the same day.
 for(const t of [...d.transactions].sort((a,b)=>a.date.localeCompare(b.date)||(a.kind==='topup'?-1:1))){card+=t.kind==='topup'?t.credit:t.kind==='wash'?-t.credit:0;if(card<0)fail(`Laundry credit would be negative on ${t.date}. Add the missing top-up or opening credit first.`);}
 return structuredClone(d);
}
