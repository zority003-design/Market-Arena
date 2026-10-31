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
  onAppearanceChange?: (ids:string[])=>void
}
const money=(n:number)=>n.toLocaleString('ru-RU')+' ₽'
const RARITY_CLASS:Record<string,string>={common:'common',uncommon:'uncommon',rare:'rare',elite:'elite',exclusive:'exclusive'}
const SKIN_TONES=[{label:'Светлый',value:'#f0c09a'},{label:'Тёплый',value:'#d8a17d'},{label:'Оливковый',value:'#b97955'},{label:'Глубокий',value:'#8d5a42'}]
const HAIR_COLORS=[{label:'Тёмный',value:'#30251f'},{label:'Каштановый',value:'#4b3028'},{label:'Русый',value:'#9a6943'},{label:'Чёрный',value:'#171b20'},{label:'Медовый',value:'#b68b56'}]
export default function ItemMarketplace({mode,cash,ownedItems,onBuy,saveSlot,outfit,onAppearanceChange}:Props){
  const [category,setCategory]=useState(mode==='equipment'?'equipment':'all')
  const [query,setQuery]=useState('')
  const [sortBy,setSortBy]=useState<'recommended'|'price-asc'|'price-desc'|'name'>('recommended')
  const [selected,setSelected]=useState<string|null>(null)
  const [customization,setCustomization]=useState<{skinTone:string;hairColor:string;hairStyle:number}>(()=>{try{return JSON.parse(localStorage.getItem('market-arena-character-appearance-'+saveSlot)||'{"skinTone":"#d8a17d","hairColor":"#30251f","hairStyle":0}')}catch{return {skinTone:'#d8a17d',hairColor:'#30251f',hairStyle:0}}})
  const [equipped,setEquipped]=useState<string[]>(()=>{
    try { const value=JSON.parse(localStorage.getItem('market-arena-equipped-'+saveSlot)||'[]'); return Array.isArray(value)?value.filter((id:string)=>ITEM_CATALOG.some(item=>item.id===id)):[] } catch{return []}
  })
  useEffect(()=>{try{localStorage.setItem('market-arena-equipped-'+saveSlot,JSON.stringify(equipped))}catch{}},[equipped,saveSlot])
  useEffect(()=>{try{localStorage.setItem('market-arena-character-appearance-'+saveSlot,JSON.stringify(customization))}catch{}},[customization,saveSlot])
  useEffect(()=>{onAppearanceChange?.(equipped)},[equipped,onAppearanceChange])
  useEffect(()=>{setCategory(mode==='equipment'?'equipment':'all')},[mode])
  const visible=useMemo(()=>{const list=ITEM_CATALOG.filter(item=>(mode==='equipment'?item.category==='equipment':item.category!=='equipment'&&item.slot!=='fullset')&&(category==='owned'?ownedItems.includes(item.id):category==='all'||item.category===category)&&(!query||[item.name,item.description,item.material].join(' ').toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru'))));return [...list].sort((a,b)=>sortBy==='price-asc'?a.price-b.price:sortBy==='price-desc'?b.price-a.price:sortBy==='name'?a.name.localeCompare(b.name,'ru'):0)},[category,mode,query,ownedItems,sortBy])
  const current=visible.find(item=>item.id===selected)??visible[0]
  const appearance={...getEquippedAppearance(equipped),...customization}
  const social=evaluateSocialAppearance(equipped,'business')
  const equip=(id:string)=>setEquipped(old=>{const item=ITEM_CATALOG.find(entry=>entry.id===id);if(!item)return old;const same=old.includes(id);const without=old.filter(existing=>ITEM_CATALOG.find(entry=>entry.id===existing)?.slot!==item.slot);return same?without:[...without,id]})
  const categories=mode==='equipment'?[{id:'equipment',label:'Оборудование'},{id:'owned',label:'Мой инвентарь'}]:[...ITEM_CATEGORIES.filter(item=>item.id!=='equipment'),{id:'owned',label:'Мой инвентарь'}]
  return <div className="marketplace-shell">
    <section className="marketplace-stage">
      <div className="marketplace-stage-top"><span>CHARACTER STUDIO · LIVE PREVIEW</span><span><span className="marketplace-live-dot"/> 3D SCENE</span></div>
      <div className="marketplace-avatar"><BrokerAvatar3D identity="player" outfit={outfit} appearance={appearance} interactive/></div>
      <div className="marketplace-stage-bottom"><div><small>ТЕКУЩИЙ ОБРАЗ</small><strong>{outfit==='premium'?'Executive':outfit==='classic'?'Business casual':'Junior'}</strong></div><div className="marketplace-stage-controls"><span><RotateCcw size={13}/> Модель можно осматривать в 3D</span></div></div>
      <div className="marketplace-social"><Sparkles size={15}/><span><b>Контекстный стиль</b><small>{social.notes} · эффект {social.score>=0?'+':''}{social.score}</small></span></div>
    </section>
    <section className="marketplace-catalog">
      <div className="marketplace-heading"><div><span className="marketplace-eyebrow">{mode==='equipment'?'WORKSPACE UPGRADES':'ARENA STYLE'}</span><h2>{mode==='equipment'?'Оборудование':'Гардероб и аксессуары'}</h2><p>{mode==='equipment'?'Покупки открывают игровые преимущества, а не остаются декором.':'Собери комплект под характер встречи. Предметы сохраняются между сессиями.'}</p></div><div className="marketplace-balance"><small>ДОСТУПНО</small><b>{money(cash)}</b></div></div>
      <div className="marketplace-customizer" style={{display:mode==='wardrobe'?'grid':'none'}}><div><label>ТОН КОЖИ</label><select value={customization.skinTone} onChange={event=>setCustomization(old=>({...old,skinTone:event.target.value}))}>{SKIN_TONES.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></div><div><label>ЦВЕТ ВОЛОС</label><select value={customization.hairColor} onChange={event=>setCustomization(old=>({...old,hairColor:event.target.value}))}>{HAIR_COLORS.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></div><div><label>ПРИЧЁСКА</label><select value={customization.hairStyle} onChange={event=>setCustomization(old=>({...old,hairStyle:Number(event.target.value)}))}><option value={0}>Короткая</option><option value={1}>Укладка</option><option value={2}>Объёмная</option><option value={3}>Боковой пробор</option></select></div></div><div className="marketplace-toolbar"><div className="marketplace-search"><Search size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Найти предмет или материал"/></div><div className="marketplace-categories">{categories.map(item=><button key={item.id} className={category===item.id?'active':''} onClick={()=>setCategory(item.id)}>{item.label}</button>)}</div><select className="marketplace-sort" value={sortBy} onChange={event=>setSortBy(event.target.value as typeof sortBy)}><option value="recommended">По умолчанию</option><option value="price-asc">Сначала дешевле</option><option value="price-desc">Сначала дороже</option><option value="name">По названию</option></select></div>
      <div className="marketplace-content">
        <div className="marketplace-items">{visible.map(item=>{const owned=ownedItems.includes(item.id);return <article key={item.id} className={'marketplace-item '+(selected===item.id?'selected ':'')+(owned?'owned':'')} onClick={()=>setSelected(item.id)}>
          <div className="marketplace-item-art" style={{'--item-color':item.color} as CSSProperties}><span>{item.category==='equipment'?<Laptop size={29}/>:item.slot==='face'?<Glasses size={29}/>:<Shirt size={29}/>}</span><small>{item.slot.toUpperCase()}</small></div>
          <div className="marketplace-item-info"><div className="marketplace-item-title"><b>{item.name}</b><span className={'marketplace-rarity '+(RARITY_CLASS[item.rarity]??'common')}>{RARITY_LABELS[item.rarity]??item.rarity}</span></div><p>{item.description}</p><div className="marketplace-item-meta"><span>{item.material}</span><b>{money(item.price)}</b></div><button className={owned?'marketplace-owned-button':'marketplace-buy-button'} disabled={owned||cash<item.price} onClick={event=>{event.stopPropagation();if(onBuy(item.id,item.price,item.name))setSelected(item.id)}}>{owned?<><Check size={14}/> В инвентаре</>:cash<item.price?'Не хватает '+money(item.price-cash):'Купить · '+money(item.price)}</button></div>
        </article>})}{visible.length===0&&<div className="marketplace-empty">Ничего не найдено. Измени запрос или категорию.</div>}</div>
        <aside className="marketplace-details">{current?<><div className="marketplace-detail-swatch" style={{'--item-color':current.color} as CSSProperties}><span>{current.category==='equipment'?<Laptop size={38}/>:<Shirt size={38}/>}</span></div><span className="marketplace-eyebrow">ПОДРОБНОСТИ ПРЕДМЕТА</span><h3>{current.name}</h3><p>{current.description}</p><dl><div><dt>Материал</dt><dd>{current.material}</dd></div><div><dt>Слот</dt><dd>{current.slot}</dd></div><div><dt>Редкость</dt><dd>{RARITY_LABELS[current.rarity]??current.rarity}</dd></div><div><dt>Цена</dt><dd>{money(current.price)}</dd></div></dl><div className="marketplace-effect"><Sparkles size={15}/><span><b>Игровой эффект</b><small>{Object.entries(current.effect).map(([key,value])=>key+': +'+value).join(' · ')}</small></span></div>{current.category!=='equipment'&&ownedItems.includes(current.id)&&<button className="marketplace-equip-button" onClick={()=>equip(current.id)}>{equipped.includes(current.id)?<><Minus size={15}/> Снять предмет</>:<><Plus size={15}/> Надеть предмет</>}</button>}{current.category==='equipment'&&<div className="marketplace-hint"><Lock size={14}/> Оборудование применяется к рабочим механикам после покупки.</div>}</>:<p>Выбери предмет для подробной информации.</p>}</aside>
      </div>
    </section>
  </div>
}
