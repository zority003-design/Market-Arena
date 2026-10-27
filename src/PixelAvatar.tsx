import type { SVGProps } from 'react'

type Outfit = 'intern' | 'classic' | 'premium'
type PixelAvatarProps = SVGProps<SVGSVGElement> & {
  outfit: Outfit
  mode?: 'full' | 'portrait'
}

/**
 * One shared pixel-art source for the wardrobe, outfit cards and the broker's
 * own camera feed. The hard-edged sprite is deliberately not a 3D render.
 */
export default function PixelAvatar({ outfit, mode = 'full', ...props }: PixelAvatarProps) {
  const intern = outfit === 'intern'
  const premium = outfit === 'premium'
  const jacket = intern ? '#477967' : premium ? '#172c39' : '#344b61'
  const jacketShade = intern ? '#315849' : premium ? '#0d1c27' : '#233647'
  const jacketLight = intern ? '#78a995' : premium ? '#355568' : '#617d96'
  const trousers = intern ? '#303e3d' : premium ? '#19232d' : '#293540'
  const shirt = intern ? '#d0b99a' : '#e9e5d9'
  const tie = premium ? '#bd9656' : '#536d85'
  const skin = '#c9916d'
  return (
    <svg
      viewBox={mode === 'portrait' ? '12 0 72 112' : '0 0 96 160'}
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
      role="img"
      aria-label={premium ? 'Пиксельный персонаж в премиальном костюме' : intern ? 'Пиксельный персонаж в одежде стажёра' : 'Пиксельный персонаж в классическом костюме'}
      {...props}
    >
      <g className="pixel-avatar-sprite">
        {mode === 'full' && <ellipse cx="48" cy="151" rx="25" ry="4" fill="#02080a" opacity=".65" />}
        {/* Shoes and legs */}
        {mode === 'full' && <>
          <rect x="31" y="126" width="14" height="18" fill={trousers} />
          <rect x="51" y="126" width="14" height="18" fill={trousers} />
          <rect x="31" y="140" width="14" height="4" fill={intern ? '#202c2b' : '#101820'} />
          <rect x="51" y="140" width="14" height="4" fill={intern ? '#202c2b' : '#101820'} />
          <rect x="26" y="144" width="20" height="6" fill="#121b20" />
          <rect x="50" y="144" width="20" height="6" fill="#121b20" />
          <rect x="29" y="144" width="14" height="2" fill="#65757a" />
          <rect x="53" y="144" width="14" height="2" fill="#65757a" />
          <rect x="45" y="128" width="6" height="13" fill="#111b21" />
          <rect x="33" y="129" width="4" height="11" fill={intern ? '#465652' : '#3e4b57'} />
          <rect x="55" y="129" width="4" height="11" fill={intern ? '#465652' : '#3e4b57'} />
        </>}
        {/* Neck and ears */}
        <rect x="40" y="43" width="16" height="13" fill={skin} />
        <rect x="36" y="29" width="4" height="10" fill="#a96f54" />
        <rect x="56" y="29" width="4" height="10" fill="#a96f54" />
        <rect x="40" y="45" width="16" height="5" fill="#b47c5c" />
        {/* Face: stepped silhouette, shadow planes and expression */}
        <rect x="36" y="15" width="24" height="25" fill="#4a3028" />
        <rect x="32" y="21" width="32" height="17" fill="#4a3028" />
        <rect x="36" y="17" width="24" height="25" fill={skin} />
        <rect x="32" y="23" width="4" height="12" fill={skin} />
        <rect x="60" y="23" width="4" height="12" fill={skin} />
        <rect x="36" y="35" width="4" height="5" fill="#b77b5c" />
        <rect x="56" y="35" width="4" height="5" fill="#b77b5c" />
        <rect x="40" y="37" width="16" height="4" fill="#b77b5c" />
        <rect x="38" y="25" width="6" height="3" fill="#33251f" />
        <rect x="52" y="25" width="6" height="3" fill="#33251f" />
        <rect x="39" y="29" width="5" height="4" fill="#f0dfc6" />
        <rect x="52" y="29" width="5" height="4" fill="#f0dfc6" />
        <rect x="41" y="30" width="3" height="3" fill="#273239" />
        <rect x="53" y="30" width="3" height="3" fill="#273239" />
        <rect x="43" y="35" width="10" height="2" fill="#8e5142" />
        <rect x="45" y="34" width="6" height="2" fill="#e0a07d" />
        <rect x="36" y="29" width="3" height="4" fill="#dca17c" />
        <rect x="57" y="29" width="3" height="4" fill="#dca17c" />
        {/* Hair silhouette, sideburns and highlights */}
        <rect x="32" y="13" width="32" height="10" fill="#2b211d" />
        <rect x="36" y="9" width="24" height="8" fill="#2b211d" />
        <rect x="40" y="7" width="16" height="4" fill="#382820" />
        <rect x="32" y="17" width="4" height="15" fill="#2b211d" />
        <rect x="60" y="17" width="4" height="15" fill="#2b211d" />
        <rect x="36" y="17" width="4" height="4" fill="#4b3528" />
        <rect x="44" y="11" width="8" height="3" fill="#4b3528" />
        <rect x="32" y="29" width="4" height="7" fill="#382820" />
        <rect x="60" y="29" width="4" height="7" fill="#382820" />
        {/* Jacket / shirt silhouette */}
        <rect x="28" y="53" width="40" height="7" fill={jacketShade} />
        <rect x="24" y="59" width="48" height="35" fill={jacketShade} />
        <rect x="28" y="55" width="40" height="34" fill={jacket} />
        <rect x="20" y="61" width="12" height="30" fill={jacketShade} />
        <rect x="64" y="61" width="12" height="30" fill={jacketShade} />
        <rect x="24" y="61" width="8" height="24" fill={jacketLight} />
        <rect x="64" y="61" width="8" height="24" fill={jacketLight} />
        <rect x="28" y="57" width="8" height="8" fill={jacketLight} />
        <rect x="60" y="57" width="8" height="8" fill={jacketLight} />
        <rect x="36" y="53" width="24" height="35" fill={shirt} />
        <rect x="40" y="53" width="16" height="4" fill="#f5eee1" />
        <rect x="40" y="57" width="4" height="9" fill="#d3cbbd" />
        <rect x="52" y="57" width="4" height="9" fill="#d3cbbd" />
        {/* Lapels and tie are outfit-specific, but the silhouette stays identical */}
        {!intern && <>
          <path d="M32 57h8l8 11-8 8-8-12z" fill={jacketLight} />
          <path d="M64 57h-8l-8 11 8 8 8-12z" fill={jacketLight} />
          <path d="M44 57h8l-2 8 4 17-6 5-6-5 4-17z" fill={tie} />
          <rect x="44" y="57" width="8" height="3" fill={premium ? '#e2c37b' : '#a6bac7'} />
          <rect x="47" y="68" width="2" height="14" fill={premium ? '#e2c37b' : '#8196a5'} />
          <rect x="32" y="77" width="5" height="3" fill={jacketShade} />
          <rect x="59" y="77" width="5" height="3" fill={jacketShade} />
          <rect x="60" y="61" width="4" height="5" fill={premium ? '#e0bd70' : '#d4e1df'} />
          {premium && <>
            <rect x="58" y="65" width="5" height="5" fill="#e6c777" />
            <rect x="60" y="67" width="2" height="2" fill="#fff0b6" />
            <rect x="31" y="84" width="6" height="2" fill="#e0bd70" />
          </>}
        </>}
        {intern && <>
          <rect x="40" y="61" width="16" height="4" fill="#b9d4c7" />
          <rect x="44" y="65" width="8" height="2" fill="#8eac9e" />
          <rect x="32" y="73" width="4" height="10" fill="#426c5a" />
          <rect x="60" y="73" width="4" height="10" fill="#426c5a" />
        </>}
        {/* Arms, cuffs and hands */}
        <rect x="20" y="63" width="8" height="27" fill={jacketShade} />
        <rect x="68" y="63" width="8" height="27" fill={jacketShade} />
        <rect x="20" y="87" width="8" height="7" fill={jacket} />
        <rect x="68" y="87" width="8" height="7" fill={jacket} />
        <rect x="20" y="94" width="8" height="8" fill={skin} />
        <rect x="68" y="94" width="8" height="8" fill={skin} />
        <rect x="21" y="94" width="4" height="3" fill="#e2aa82" />
        {/* Belt, torso edge and legs */}
        <rect x="28" y="88" width="40" height="5" fill={trousers} />
        <rect x="28" y="93" width="40" height="5" fill={premium ? '#b6975a' : '#202b31'} />
        {mode === 'full' && <>
          <rect x="30" y="98" width="15" height="29" fill={trousers} />
          <rect x="51" y="98" width="15" height="29" fill={trousers} />
          <rect x="30" y="99" width="4" height="25" fill={intern ? '#485653' : '#3a4650'} />
          <rect x="51" y="99" width="4" height="25" fill={intern ? '#485653' : '#3a4650'} />
          <rect x="42" y="98" width="9" height="29" fill="#101a20" />
          <rect x="35" y="103" width="6" height="2" fill="#6c7a7c" />
          <rect x="55" y="103" width="6" height="2" fill="#6c7a7c" />
        </>}
        {/* Tiny seams, pocket stitch and buttons add readable pixel detail */}
        <rect x="29" y="68" width="2" height="18" fill={jacketLight} />
        <rect x="65" y="68" width="2" height="18" fill={jacketShade} />
        <rect x="33" y="88" width="8" height="2" fill={premium ? '#d6b46a' : '#91a69f'} />
        {!intern && <rect x="57" y="88" width="2" height="2" fill="#d9e1db" />}
      </g>
    </svg>
  )
}
