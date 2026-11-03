import {useEffect,useState} from 'react';
import {fallbackCurrencies,parseCurrencies,parseRates,parseRateCache,type RateCache,type CurrencyInfo} from './fx';
const rateKey='pocket-fx-rates-v1',listKey='pocket-fx-currencies-v1',ttl=6*60*60*1000;
function readJSON(key:string){try{return JSON.parse(localStorage.getItem(key)??'null');}catch{return null;}}
function readList(){try{return parseCurrencies(readJSON(listKey));}catch{return fallbackCurrencies();}}
let pending:Promise<{list:CurrencyInfo[];cache:RateCache}>|null=null;
function fetchLatest(){if(!pending)pending=(async()=>{const [c,r]=await Promise.all([fetch('https://api.frankfurter.dev/v2/currencies',{signal:AbortSignal.timeout(12000)}),fetch('https://api.frankfurter.dev/v2/rates?base=EUR',{signal:AbortSignal.timeout(12000)})]);if(!c.ok||!r.ok)throw new Error('Exchange-rate service is unavailable.');return {list:parseCurrencies(await c.json()),cache:{fetchedAt:Date.now(),rates:parseRates(await r.json())}};})().finally(()=>{pending=null;});return pending;}
export function useExchangeRates(){
 const [currencies,setCurrencies]=useState(readList),[cache,setCache]=useState(()=>parseRateCache(readJSON(rateKey))),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function refresh(force=false){const existing=parseRateCache(readJSON(rateKey));if(!force&&existing&&Date.now()-existing.fetchedAt<ttl){setCache(existing);return;}setBusy(true);setError('');try{const result=await fetchLatest();setCurrencies(result.list);setCache(result.cache);try{localStorage.setItem(listKey,JSON.stringify(result.list));localStorage.setItem(rateKey,JSON.stringify(result.cache));}catch{/* In-memory rates still work when browser storage is full. */}}catch{setError('Could not refresh rates. Use the last saved rate or enter your bank rate.');}finally{setBusy(false);}}
 useEffect(()=>{const check=()=>{if(document.visibilityState!=='hidden')void refresh();};check();window.addEventListener('online',check);window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);const timer=setInterval(check,60*60*1000);return()=>{window.removeEventListener('online',check);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);clearInterval(timer);};},[]);
 return {currencies,cache,busy,error,refresh};
}
