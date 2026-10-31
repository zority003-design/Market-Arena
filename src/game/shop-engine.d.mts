import type { CatalogItem } from './item-catalog.mjs';
export function purchaseCatalogItem(economy:{cash:number;processed:string[];[key:string]:any},inventory:string[],itemId:string,operationId:string,context?:{day?:number;reputation?:number}):{economy:any;inventory:string[];item:CatalogItem};
export function toggleEquippedItem(equipped:string[],itemId:string):string[];
