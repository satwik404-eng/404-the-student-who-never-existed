export function ArchiveArtwork({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "archive-art small" : "archive-art"}
      viewBox="0 0 760 720"
      role="img"
      aria-label="An erased student identity suspended inside a cobalt archive ring"
    >
      <defs>
        <radialGradient id="halo">
          <stop stopColor="#0c3bae" stopOpacity=".6" />
          <stop offset="1" stopColor="#030407" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#8ab8ff" />
          <stop offset=".2" stopColor="#184bbb" />
          <stop offset=".48" stopColor="#071630" />
          <stop offset=".65" stopColor="#3467db" />
          <stop offset="1" stopColor="#07112a" />
        </linearGradient>
        <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#173c88" />
          <stop offset=".35" stopColor="#071b45" />
          <stop offset="1" stopColor="#030814" />
        </linearGradient>
        <linearGradient id="edge">
          <stop stopColor="#9ec1ff" />
          <stop offset=".5" stopColor="#1558c9" />
          <stop offset="1" stopColor="#06102b" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope=".11" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="soft-light" />
        </filter>
      </defs>
      <circle cx="400" cy="360" r="360" fill="url(#halo)" />
      <g className="orbit-back" transform="rotate(-30 400 350)">
        <ellipse
          cx="400"
          cy="350"
          rx="292"
          ry="190"
          fill="none"
          stroke="#184492"
          strokeWidth="1"
        />
        <ellipse
          cx="400"
          cy="350"
          rx="250"
          ry="242"
          fill="none"
          stroke="url(#metal)"
          strokeWidth="52"
        />
        <ellipse
          cx="400"
          cy="350"
          rx="247"
          ry="240"
          fill="none"
          stroke="#76a0f5"
          strokeOpacity=".65"
          strokeWidth="1"
        />
        <ellipse
          cx="400"
          cy="350"
          rx="221"
          ry="215"
          fill="none"
          stroke="#020713"
          strokeWidth="5"
        />
      </g>
      <g
        className="identity-card"
        transform="translate(251 143) rotate(13 150 205)"
      >
        <rect
          x="12"
          y="13"
          width="304"
          height="424"
          rx="18"
          fill="#02040b"
          stroke="#3262b3"
        />
        <rect
          width="304"
          height="424"
          rx="18"
          fill="url(#card)"
          stroke="url(#edge)"
          strokeWidth="2"
          filter="url(#grain)"
        />
        <path d="M0 83H304M0 336H304" stroke="#547aaf" strokeOpacity=".5" />
        <text
          x="23"
          y="31"
          fill="#b5c8e6"
          fontFamily="monospace"
          fontSize="9"
          letterSpacing="2"
        >
          MERIDIAN UNIVERSITY
        </text>
        <text
          x="23"
          y="57"
          fill="#6c8fcb"
          fontFamily="monospace"
          fontSize="8"
          letterSpacing="3"
        >
          IDENTITY ARCHIVE / 2026
        </text>
        <rect x="227" y="24" width="54" height="34" rx="3" fill="#d4ff24" />
        <text
          x="254"
          y="46"
          textAnchor="middle"
          fill="#101600"
          fontFamily="monospace"
          fontSize="14"
          fontWeight="bold"
        >
          404
        </text>
        <g fill="#01040a" stroke="#31518b" strokeWidth="1">
          <ellipse cx="153" cy="163" rx="41" ry="49" />
          <path d="M77 298V279C77 218 228 218 228 279V298Z" />
        </g>
        <path
          d="M57 103H34V126M248 103H271V126M34 285V310H58M247 310H271V285"
          fill="none"
          stroke="#4875be"
        />
        <g stroke="#5a81c4" strokeOpacity=".45">
          {Array.from({ length: 23 }, (_, i) => (
            <path key={i} d={`M24 ${110 + i * 9}H281`} />
          ))}
        </g>
        <rect x="34" y="185" width="237" height="38" fill="#02060e" />
        <text
          x="153"
          y="210"
          textAnchor="middle"
          fill="#d4ff24"
          fontFamily="monospace"
          fontSize="21"
          letterSpacing="6"
        >
          [ ERASED ]
        </text>
        <text
          x="24"
          y="362"
          fill="#90a4c5"
          fontFamily="monospace"
          fontSize="9"
          letterSpacing="2"
        >
          AARYA SEN
        </text>
        <text
          x="24"
          y="387"
          fill="#e8efff"
          fontFamily="monospace"
          fontSize="16"
          letterSpacing="1"
        >
          AS—042
        </text>
        <g stroke="#4876c4">
          {Array.from({ length: 25 }, (_, i) => (
            <path
              key={i}
              strokeWidth={i % 3 === 0 ? 3 : 1}
              d={`M${176 + i * 4} 355V391`}
            />
          ))}
        </g>
        <text
          x="24"
          y="410"
          fill="#536b90"
          fontFamily="monospace"
          fontSize="7"
          letterSpacing="2"
        >
          ENROLLMENT STATUS: DELETED
        </text>
      </g>
      <path
        d="M163 458C210 596 479 648 617 443"
        fill="none"
        stroke="url(#metal)"
        strokeWidth="53"
      />
      <path
        d="M163 449C217 589 486 635 617 434"
        fill="none"
        stroke="#568cf0"
        strokeWidth="1.3"
      />
      <path
        d="M165 477C242 602 483 644 605 465"
        fill="none"
        stroke="#020916"
        strokeWidth="9"
      />
      <g fill="#d4ff24">
        <circle cx="616" cy="434" r="5" />
        <circle cx="127" cy="254" r="3" />
      </g>
      <g fontFamily="monospace" fontSize="9" letterSpacing="2" fill="#71829e">
        <text x="519" y="128">
          RECOVERY NODE_04
        </text>
        <path d="M510 135L464 178" stroke="#3b4b65" />
        <text x="66" y="592">
          NO MATCH FOUND
        </text>
        <path d="M191 589H242L276 552" fill="none" stroke="#3b4b65" />
        <text x="529" y="630">
          SIGNAL STILL ACTIVE
        </text>
      </g>
      <path d="M90 360H650" stroke="#477af2" strokeOpacity=".3" />
      <path d="M372 65V655" stroke="#477af2" strokeOpacity=".12" />
    </svg>
  );
}
