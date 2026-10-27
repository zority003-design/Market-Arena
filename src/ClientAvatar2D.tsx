type Mood = 'skeptical' | 'neutral' | 'interested' | 'angry' | 'happy'
type Props = { tier: number; mood?: Mood; variant?: 'client' | 'player'; outfit?: 'intern' | 'classic' | 'premium'; className?: string; identity?: string }

const skinTones = ['#d5a07d', '#efc5a1', '#b87959', '#dfb18d', '#9a624a', '#c88d6b']
const hairTones = ['#30221d', '#594033', '#8a5b35', '#17191c', '#b38a55', '#49342d']
const jackets = ['#3b5664', '#d6ddd6', '#365c4e', '#69493e', '#45516d', '#29313a']
const pixelSeed = (value: string) => Array.from(value).reduce((n, char) => (n * 31 + char.charCodeAt(0)) >>> 0, 7)

/** Chunky 2D pixel portrait. Client identity changes face, hair and jacket palette so the CRM feels like a cast, not one repeated illustration. */
export default function ClientAvatar2D({ tier, mood = 'neutral', variant = 'client', outfit = 'intern', className = '', identity = '' }: Props) {
  const seed = pixelSeed(identity || String(Math.abs(Math.floor(tier))))
  const skin = variant === 'player' ? '#c9916d' : skinTones[seed % skinTones.length]
  const hair = variant === 'player' ? '#30221d' : hairTones[(seed >>> 3) % hairTones.length]
  const jacket = variant === 'player' ? (outfit === 'premium' ? '#172c39' : outfit === 'classic' ? '#344b61' : '#477967') : jackets[(seed >>> 5) % jackets.length]
  const shirt = variant === 'player' && outfit === 'intern' ? '#d0b99a' : '#e9e5d9'
  const tie = variant === 'player' && outfit === 'premium' ? '#bd9656' : variant === 'player' ? '#536d85' : (seed % 2 ? '#b58b54' : '#547789')
  const hairStyle = (seed >>> 7) % 3
  const happy = mood === 'happy' || mood === 'interested'
  return <svg className={'client-avatar-2d pixel-client-avatar ' + className} viewBox="0 0 180 210" role="img" aria-label={variant === 'player' ? 'Ваш пиксельный 2D-персонаж' : 'Пиксельный портрет клиента'} preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges">
    <rect x="24" y="198" width="132" height="8" fill="#071016" opacity=".22"/>
    <rect x="26" y="164" width="16" height="44" fill="#172630"/><rect x="138" y="164" width="16" height="44" fill="#172630"/>
    <rect x="38" y="148" width="104" height="60" fill={jacket}/><rect x="54" y="154" width="72" height="54" fill={jacket}/>
    <rect x="72" y="140" width="36" height="28" fill={skin}/>
    <rect x="70" y="151" width="40" height="57" fill={shirt}/>
    <rect x="84" y="157" width="12" height="9" fill={tie}/><rect x="80" y="166" width="20" height="23" fill={tie}/><rect x="84" y="189" width="12" height="15" fill={tie}/>
    {variant === 'player' && outfit === 'premium' && <><rect x="40" y="157" width="12" height="35" fill="#bd9656"/><rect x="128" y="157" width="12" height="35" fill="#bd9656"/></>}
    <rect x="50" y="49" width="80" height="83" fill={skin}/><rect x="58" y="37" width="64" height="104" fill={skin}/>
    <rect x="42" y="44" width="16" height="47" fill={hair}/><rect x="58" y="28" width="64" height="18" fill={hair}/><rect x="74" y="20" width="32" height="10" fill={hair}/><rect x="122" y="43" width="16" height="44" fill={hair}/>
    {hairStyle === 0 && <><rect x="42" y="36" width="20" height="20" fill={hair}/><rect x="58" y="20" width="32" height="16" fill={hair}/></>}
    {hairStyle === 1 && <><rect x="58" y="20" width="64" height="10" fill={hair}/><rect x="106" y="30" width="24" height="12" fill={hair}/></>}
    {hairStyle === 2 && <><rect x="42" y="44" width="16" height="42" fill={hair}/><rect x="58" y="28" width="64" height="10" fill={hair}/><rect x="122" y="43" width="16" height="25" fill={hair}/></>}
    <rect x="42" y="76" width="8" height="20" fill={skin}/><rect x="130" y="76" width="8" height="20" fill={skin}/>
    <rect x="60" y="77" width="20" height="5" fill="#49332a"/><rect x="100" y="77" width="20" height="5" fill="#49332a"/>
    {mood === 'skeptical' && <><rect x="60" y="72" width="20" height="5" fill="#49332a"/><rect x="100" y="77" width="20" height="5" fill="#49332a"/></>}
    {mood === 'angry' && <><rect x="60" y="82" width="20" height="5" fill="#49332a"/><rect x="100" y="82" width="20" height="5" fill="#49332a"/></>}
    <rect x="64" y="88" width="12" height="12" fill="#f5eee5"/><rect x="104" y="88" width="12" height="12" fill="#f5eee5"/>
    <rect x={68 + (seed % 3)} y="92" width="6" height="7" fill="#29363a"/><rect x={108 + ((seed >>> 2) % 3)} y="92" width="6" height="7" fill="#29363a"/>
    <rect x="86" y="100" width="8" height="12" fill="#a86f54"/><rect x="82" y="109" width="12" height="4" fill="#a86f54"/>
    {happy ? <><rect x="72" y="120" width="36" height="5" fill="#7e3e38"/><rect x="78" y="125" width="24" height="5" fill="#7e3e38"/><rect x="82" y="120" width="16" height="5" fill="#f2d4c3"/></> : mood === 'angry' ? <><rect x="76" y="122" width="28" height="5" fill="#7e3e38"/><rect x="82" y="117" width="16" height="5" fill="#7e3e38"/></> : <rect x="78" y="121" width="24" height="5" fill="#7e3e38"/>}
    <rect x="42" y="153" width="12" height="28" fill={jacket}/><rect x="126" y="153" width="12" height="28" fill={jacket}/>
    <rect x="48" y="153" width="7" height="7" fill="#ffffff" opacity=".18"/><rect x="125" y="153" width="7" height="7" fill="#ffffff" opacity=".18"/>
  </svg>
}
