export type EconomyState = {schemaVersion?:number;cash:number;assets?:any[];liabilities?:any[];ledger?:any[];processed:string[]};
export function createEconomy(input?:{cash?:number;assets?:any[];liabilities?:any[];ledger?:any[];processed?:string[]}): EconomyState;
export function transact(economy:EconomyState,operation:{id:string;type:string;amount:number;description?:string;allowCredit?:boolean;metadata?:Record<string,unknown>}):EconomyState;
export function buyAsset(economy:EconomyState,asset:any,operationId:string):EconomyState;
export function sellAsset(economy:EconomyState,assetId:string,price:number,operationId:string):EconomyState;
export function issueDebt(economy:EconomyState,input:any):EconomyState;
export function repayDebt(economy:EconomyState,debtId:string,amount:number,operationId:string):EconomyState;
export function netWorth(economy:EconomyState):{cash:number;assets:number;debt:number;netWorth:number};
export function migrateEconomySave(save:any):any;
