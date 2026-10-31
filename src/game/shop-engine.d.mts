import type { CatalogItem } from './item-catalog.mjs';
import type { EconomyState } from './economy-engine.mjs';
export function purchaseCatalogItem(economy:EconomyState,inventory:string[],itemId:string,operationId:string,context?:{day?:number;reputation?:number}):{economy:EconomyState;inventory:string[];item:CatalogItem};
export function toggleEquippedItem(equipped:string[],itemId:string):string[];
