import './ItemMarketplace.css'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Check, Search, Shirt, Glasses, Laptop, Sparkles, Lock, Plus, Minus, RotateCcw } from 'lucide-react'
import BrokerAvatar3D from './BrokerAvatar3D'
import { ITEM_CATALOG, ITEM_CATEGORIES, RARITY_LABELS, getEquippedAppearance, evaluateSocialAppearance } from './game/item-catalog.mjs'

type Props = {
  mode: 'wardrobe'|'equipment'
  cash: number
  ownedItems: string[]
  onBuy: (id:string, price:number, description:string) => boolean
  saveSlot: number
  outfit: 'intern'|'classic'|'premium'
}
const money=(n:number)=>n.toLocaleString('ru-RU')+' ₽'
const RARITY_CLASS:Record<string,string>={common:'common',uncommon:'uncommon',rare:'rare',elite:'elite',exclusive:'exclusive'}
export default function ItemMarketplace({mode,cash,ownedItems,onBuy,saveSlot,outfit,onAppearanceChange}:Props){
  const [category,setCategory]=useState(mode==='equipment'?'equipment':'all')
  const [query,setQuery]=useState('')
  const [selected,setSelected]=useState<string|null>(null)
  const [equipped,setEquipped]=useState<string[]>(()=>{
    try { const value=JSON.parse(localStorage.getItem('market-arena-equipped-'+saveSlot)||'[]'); return Array.isArray(value)?value.filter((id:string)=>ITEM_CATALOG.some(item=>item.id===id)):[] } catch{return []}
  })
  useEffect(()=>{try{localStorage.setItem('market-arena-equipped-'+saveSlot,JSON.stringify(equipped))}catch{}},[equipped,saveSlot])
  useEffect(()=>{onAppearanceChange?.(equipped)},[equipped,onAppearanceChange])
  useEffect(()=>{setCategory(mode==='equipment'?'equipment':'all')},[mode])
  const visible=useMemo(()=>ITEM_CATALOG.filter(item=>(mode==='equipment'?item.category==='equipment':item.category!=='equipment')&&(category==='all'||item.category===category)&&(!query||[item.name,item.description,item.material].join(' ').toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru')))),[category,mode,query])
  const current=ITEM_CATALOG.find(item=>item.id===selected)??visible[0]
  const appearance=getEquippedAppearance(equipped)
  const social=evaluateSocialAppearance(equipped,'business')
  const equip=(id:string)=>setEquipped(old=>{const item=ITEM_CATALOG.find(entry=>entry.id===id);if(!item)return old;const same=old.includes(id);const without=old.filter(existing=>ITEM_CATALOG.find(entry=>entry.id===existing)?.slot!==item.slot);return same?without:[...without,id]})
  const categories=mode==='equipment'?ITEM_CATEGORIES.filter(item=>item.id==='equipment'):ITEM_CATEGORIES.filter(item=>item.id!=='equipment')
  return <div className="marketplace-shell">
    <section className="marketplace-stage">
      <div className="marketplace-stage-top"><span>CHARACTER STUDIO · LIVE PREVIEW</span><span><span className="marketplace-live-dot"/> 3D SCENE</span></div>
      <div className="marketplace-avatar"><BrokerAvatar3D identity="player" outfit={outfit} appearance={appearance}/></div>
      <div className="marketplace-stage-bottom"><div><small>ТЕКУЩИЙ ОБРАЗ</small><strong>{outfit==='premium'?'Executive':outfit==='classic'?'Business casual':'Junior'}</strong></div><div className="marketplace-stage-controls"><span><RotateCcw size={13}/> Модель можно осматривать в 3D</span></div></div>
      <div className="marketplace-social"><Sparkles size={15}/><span><b>Контекстный стиль</b><small>{social.notes} · эффект {social.score>=0?'+':''}{social.score}</small></span></div>
    </section>
    <section className="marketplace-catalog">
      <div className="marketplace-heading"><div><span className="marketplace-eyebrow">{mode==='equipment'?'WORKSPACE UPGRADES':'ARENA STYLE'}</span><h2>{mode==='equipment'?'Оборудование':'Гардероб и аксессуары'}</h2><p>{mode==='equipment'?'Покупки открывают игровые преимущества, а не остаются декором.':'Собери комплект под характер встречи. Предметы сохраняются между сессиями.'}</p></div><div className="marketplace-balance"><small>ДОСТУПНО</small><b>{money(cash)}</b></div></div>
      <div className="marketplace-toolbar"><div className="marketplace-search"><Search size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Найти предмет или материал"/></div><div className="marketplace-categories">{categories.map(item=><button key={item.id} className={category===item.id?'active':''} onClick={()=>setCategory(item.id)}>{item.label}</button>)}</div></div>
      <div className="marketplace-content">
        <div className="marketplace-items">{visible.map(item=>{const owned=ownedItems.includes(item.id);const isEquipped=equipped.includes(item.id);return <article key={item.id} className={'marketplace-item '+(selected===item.id?'selected ':'')+(owned?'owned':'')} onClick={()=>setSelected(item.id)}>
          <div className="marketplace-item-art" style={{'--item-color':item.color} as CSSProperties}><span>{item.category==='equipment'?<Laptop size={29}/>:item.slot==='face'?<Glasses size={29}/>:<Shirt size={29}/>}</span><small>{item.slot.toUpperCase()}</small></div>
          <div className="marketplace-item-info"><div className="marketplace-item-title"><b>{item.name}</b><span className={'marketplace-rarity '+(RARITY_CLASS[item.rarity]??'common')}>{RARITY_LABELS[item.rarity]??item.rarity}</span></div><p>{item.description}</p><div className="marketplace-item-meta"><span>{item.material}</span><b>{money(item.price)}</b></div><button className={owned?'marketplace-owned-button':'marketplace-buy-button'} disabled={owned||cash<item.price} onClick={event=>{event.stopPropagation();if(onBuy(item.id,item.price,item.name))setSelected(item.id)}}>{owned?<><Check size={14}/> В инвентаре</>:cash<item.price?'Не хватает '+money(item.price-cash):'Купить · '+money(item.price)}</button></div>
        </article>})}{visible.length===0&&<div className="marketplace-empty">Ничего не найдено. Измени запрос или категорию.</div>}</div>
        <aside className="marketplace-details">{current?<><div className="marketplace-detail-swatch" style={{'--item-color':current.color} as CSSProperties}><span>{current.category==='equipment'?<Laptop size={38}/>:<Shirt size={38}/>}</span></div><span className="marketplace-eyebrow">ПОДРОБНОСТИ ПРЕДМЕТА</span><h3>{current.name}</h3><p>{current.description}</p><dl><div><dt>Материал</dt><dd>{current.material}</dd></div><div><dt>Слот</dt><dd>{current.slot}</dd></div><div><dt>Редкость</dt><dd>{RARITY_LABELS[current.rarity]??current.rarity}</dd></div><div><dt>Цена</dt><dd>{money(current.price)}</dd></div></dl><div className="marketplace-effect"><Sparkles size={15}/><span><b>Игровой эффект</b><small>{Object.entries(current.effect).map(([key,value])=>key+': +'+value).join(' · ')}</small></span></div>{current.category!=='equipment'&&ownedItems.includes(current.id)&&<button className="marketplace-equip-button" onClick={()=>equip(current.id)}>{equipped.includes(current.id)?<><Minus size={15}/> Снять предмет</>:<><Plus size={15}/> Надеть предмет</>}</button>}{current.category==='equipment'&&<div className="marketplace-hint"><Lock size={14}/> Оборудование применяется к рабочим механикам после покупки.</div>}</>:<p>Выбери предмет для подробной информации.</p>}</aside>
      </div>
    </section>
  </div>
}
