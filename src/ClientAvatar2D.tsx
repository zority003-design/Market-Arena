type Mood = 'skeptical' | 'neutral' | 'interested' | 'angry' | 'happy'
type Props = { tier: number; mood?: Mood; variant?: 'client' | 'player'; outfit?: 'intern' | 'classic' | 'premium'; className?: string }

const skinTones = ['#d5a07d', '#efc5a1', '#b87959', '#dfb18d', '#9a624a', '#c88d6b']
const hairTones = ['#30221d', '#594033', '#8a5b35', '#17191c', '#b38a55', '#49342d']
const jackets = ['#3b5664', '#d6ddd6', '#365c4e', '#69493e', '#45516d', '#29313a']

/** One shared, smooth 2D character style for both sides of every call. Framed as a deliberate bust portrait so limbs are never awkwardly clipped. */
export default function ClientAvatar2D({ tier, mood = 'neutral', variant = 'client', outfit = 'intern', className = '' }: Props) {
  const seed = Math.abs(Math.floor(tier))
  const skin = variant === 'player' ? '#c9916d' : skinTones[seed % skinTones.length]
  const hair = variant === 'player' ? '#30221d' : hairTones[(seed * 3 + 1) % hairTones.length]
  const jacket = variant === 'player' ? (outfit === 'premium' ? '#172c39' : outfit === 'classic' ? '#344b61' : '#477967') : jackets[(seed + 2) % jackets.length]
  const shirt = variant === 'player' && outfit === 'intern' ? '#d0b99a' : '#e9e5d9'
  const tie = variant === 'player' && outfit === 'premium' ? '#bd9656' : variant === 'player' ? '#536d85' : (seed % 2 ? '#b58b54' : '#547789')
  const happy = mood === 'happy' || mood === 'interested'
  const leftBrow = mood === 'skeptical' ? 'M64 82 Q73 75 82 81' : mood === 'angry' ? 'M64 77 Q73 84 82 81' : 'M64 80 Q73 77 82 80'
  const rightBrow = mood === 'skeptical' ? 'M99 81 Q108 75 117 82' : mood === 'angry' ? 'M99 81 Q108 84 117 77' : 'M99 80 Q108 77 117 80'
  return <svg className={'client-avatar-2d ' + className} viewBox="0 0 180 210" role="img" aria-label={variant === 'player' ? 'Ваш 2D-персонаж' : '2D-портрет клиента'} preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id={'skin-'+variant+'-'+seed} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={skin}/><stop offset="1" stopColor="#8e5d48"/></linearGradient>
      <linearGradient id={'jacket-'+variant+'-'+seed} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={jacket}/><stop offset="1" stopColor={variant === 'player' && outfit === 'premium' ? '#0d1c27' : '#18262e'}/></linearGradient>
    </defs>
    <ellipse cx="90" cy="201" rx="54" ry="6" fill="#071016" opacity=".24"/>
    <path d="M22 208 Q26 155 58 145 L76 137 H104 L122 145 Q154 155 158 208Z" fill={'url(#jacket-'+variant+'-'+seed+')'}/>
    <path d="M72 143 L90 165 L108 143 L112 208 H68Z" fill={shirt}/>
    <path d="M84 158 L96 158 L103 195 L90 207 L77 195Z" fill={tie}/>
    {variant === 'player' && outfit === 'premium' && <path d="M44 159 L60 148 L70 155 L59 178Z M136 159 L120 148 L110 155 L121 178Z" fill="#bd9656" opacity=".95"/>}
    <path d="M71 135 L109 135 L106 158 Q90 173 74 158Z" fill={'url(#skin-'+variant+'-'+seed+')'}/>
    <path d="M52 58 Q53 23 90 24 Q128 24 129 61 L125 104 Q119 135 91 140 Q62 136 55 105Z" fill={'url(#skin-'+variant+'-'+seed+')'}/>
    <path d={variant === 'player' && outfit === 'premium' ? 'M49 75 Q37 30 71 15 Q106 1 129 29 Q141 45 131 79 L123 55 Q104 54 91 38 Q75 58 53 61Z' : 'M50 73 Q38 31 70 16 Q105 2 128 29 Q140 45 130 78 L122 57 Q103 56 91 39 Q76 58 54 60Z'} fill={hair}/>
    <path d="M55 58 Q64 39 82 35 Q96 48 121 48 L128 64 Q111 62 98 56 Q78 66 55 65Z" fill={hair}/>
    <path d={leftBrow} stroke="#49332a" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
    <path d={rightBrow} stroke="#49332a" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
    <ellipse cx="74" cy="88" rx="5" ry="6" fill="#f5eee5"/><ellipse cx="107" cy="88" rx="5" ry="6" fill="#f5eee5"/>
    <circle cx="75" cy="89" r="2.8" fill="#29363a"/><circle cx="106" cy="89" r="2.8" fill="#29363a"/>
    <path d="M90 91 L86 105 Q90 109 95 105" fill="none" stroke="#a86f54" strokeWidth="2.5" strokeLinecap="round"/>
    {happy ? <path d="M77 116 Q90 130 104 116" fill="none" stroke="#7e3e38" strokeWidth="3.5" strokeLinecap="round"/> : <path d={mood === 'angry' ? 'M78 121 Q90 112 103 121' : 'M79 119 Q90 122 102 119'} fill="none" stroke="#7e3e38" strokeWidth="3.5" strokeLinecap="round"/>}
    <path d="M53 87 Q46 90 53 101 M128 87 Q135 90 128 101" fill="none" stroke={skin} strokeWidth="8" strokeLinecap="round"/>
    <path d="M38 177 L57 156 M142 177 L123 156" stroke="#ffffff" strokeOpacity=".13" strokeWidth="5" strokeLinecap="round"/>
  </svg>
}
