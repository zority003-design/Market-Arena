export type ItemCategory = 'clothing'|'accessory'|'equipment';
export type CatalogItem = {id:string;name:string;category:ItemCategory;slot:string;price:number;rarity:string;material:string;description:string;tags:string[];effect:Record<string,number>;color:string;minDay?:number;minReputation?:number};
export const ITEM_CATALOG: CatalogItem[];
export const ITEM_CATEGORIES: {id:string;label:string}[];
export const RARITY_LABELS: Record<string,string>;
export function getItemById(id:string): CatalogItem|null;
export function getEquippedAppearance(ids?:string[]): {jacketColor?:string;trousersColor?:string;shoeColor?:string;watch:boolean;glasses:boolean;backpack:boolean;belt:boolean;equippedIds:string[]};
export function evaluateSocialAppearance(ids?:string[],context?:string,personality?:string): {score:number;fit:number;mismatch:number;notes:string};
