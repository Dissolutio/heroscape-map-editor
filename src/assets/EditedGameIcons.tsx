export function Hexes2DIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      style={{
        height: '1em',
        width: '1em',
      }}
    >
      <defs>
        <linearGradient x1="0" x2="1" y1="1" y2="0" id="skoll-hexes-gradient-1">
          <stop offset="0%" stopColor="#00a100" stopOpacity="1"></stop>
          <stop offset="100%" stopColor="#4a90e2" stopOpacity="1"></stop>
        </linearGradient>
        <linearGradient
          x1="0"
          x2="1"
          y1="0"
          y2="1"
          id="skoll-hexes-gradient-12"
        >
          <stop offset="0%" stopColor="#3d6a7b" stopOpacity="1"></stop>
          <stop offset="100%" stopColor="#2f5360" stopOpacity="1"></stop>
        </linearGradient>
        <linearGradient id="skoll-hexes-gradient-15">
          <stop offset="0%" stopColor="#3d6a7b" stopOpacity="1"></stop>
          <stop offset="100%" stopColor="#2f5360" stopOpacity="1"></stop>
        </linearGradient>
        <linearGradient id="skoll-hexes-gradient-17">
          <stop offset="0%" stopColor="#9b9b9b" stopOpacity="1"></stop>
          <stop offset="100%" stopColor="#00a100" stopOpacity="1"></stop>
        </linearGradient>
        <linearGradient
          x1="0"
          x2="1"
          y1="1"
          y2="0"
          id="skoll-hexes-gradient-20"
        >
          <stop offset="0%" stopColor="#3d6a7b" stopOpacity="1"></stop>
          <stop offset="100%" stopColor="#2f5360" stopOpacity="1"></stop>
        </linearGradient>
        <linearGradient
          x1="0"
          x2="1"
          y1="0"
          y2="1"
          id="skoll-hexes-gradient-21"
        >
          <stop offset="0%" stopColor="#9b9b9b" stopOpacity="1"></stop>
          <stop offset="100%" stopColor="#00a100" stopOpacity="1"></stop>
        </linearGradient>
      </defs>
      <rect
        fill="#000"
        fillOpacity="1"
        height="512"
        width="512"
        rx="20"
        ry="20"
      ></rect>
      <g transform="translate(0,0)">
        <path
          d="M18 18v61.193l25.22-7.142L56.886 18zm56.643 0L59.91 76.28l53.06 51.58 71.16-20.15L202.27 36l-18.5-18zm133.845 0 5.782 5.62L234.123 18zm104.27 0 42.453 41.27 71.158-20.15L431.715 18zm136.701 0-6.43 25.33L494 92.842V18zm-159.328 2-71.16 20.18-18.16 71.74 53 51.57 71.25-20.16 18.138-71.71zm140.988 35.69-71.228 20.15-18.131 71.71 53.05 51.58L465.98 179l18.14-71.74zM47.891 88.62 18 97.083v133.191l64.81-18.355 18.13-71.71zm140.99 35.65-71.192 20.16-18.18 71.71 53.061 51.58 71.17-20.14 18.14-71.74zM494 138.408 482.68 183.2 494 194.203zM329.74 159.9 258.57 180l-18.14 71.74 53 51.57 71.19-20.16 18.19-71.67zm140.93 35.65-71.19 20.15-18.13 71.71L434.41 339 494 322.125V218.227zM87.49 228.49 18 248.168v91.406l33.23 32.276 71.18-20.07 18.13-71.71zm140.95 35.65-71.19 20.16-18.14 71.7 53.06 51.58 71.16-20.15 18.14-71.74zm140.9 35.62-71.16 20.15-18.14 71.74 53 51.57 71.19-20.16 18.14-71.71zM494 340.018l-54.92 15.543-18.13 71.709 53.06 51.58 19.99-5.657zm-476 23.63v93.233l3.09-.881 18.14-71.71zm109.07 4.702L55.93 388.5l-18.12 71.74L72.515 494h81.154l8.332-2.36 18.13-71.71zM268.03 404l-71.22 20.15L179.185 494H311.36l9.72-38.44zm140.91 35.62-71.13 20.15-8.677 34.23h132.162l.705-2.79zM25.81 472.59 18 474.8V494h29.824zM494 487.73l-15.92 4.5-.447 1.77H494z"
          fill="url(#skoll-hexes-gradient-1)"
        ></path>
      </g>
      <g
        fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol"
        fontSize="280"
        fontStyle="italic"
        fontWeight="bold"
        textAnchor="middle"
        textDecoration="underline rgba(255, 255, 255, 1)"
        transform="translate(256,300)"
      >
        <g>
          <text stroke="rgba(74, 74, 74, 1)" strokeWidth="30">
            <tspan x="0" y="0">
              2D
            </tspan>
          </text>
          <text fill="rgba(255, 255, 255, 1)">
            <tspan x="0" y="0">
              2D
            </tspan>
          </text>
        </g>
      </g>
    </svg>
  )
}
export function World3DIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      style={{
        height: '1em',
        width: '1em',
      }}
    >
      <circle
        cx="256"
        cy="256"
        r="236"
        fill="#00a100"
        fillOpacity="1"
        stroke="#000000"
        strokeOpacity="1"
        strokeWidth="20"
      ></circle>
      <g transform="translate(0,0)">
        <path
          d="M253.47 17.406c-129.71 0-235.033 105.354-235.033 235.064 0 129.707 105.324 235.06 235.03 235.06 129.707 0 235.063-105.353 235.063-235.06 0-129.71-105.355-235.064-235.06-235.064zM367.874 68.75c61.246 38.19 101.97 106.14 101.97 183.72 0 17.143-1.993 33.823-5.75 49.81l-34.25-18.06 22 54.874c-9.454 21.647-22.362 41.432-38 58.687l-43.158-30.936-64.625 47.72-61.656 6.967-13.906-41.78-49.72 26.844-68.093-18.938 9.157 36.594c-28.41-21.793-51.23-50.466-66-83.563L81.25 304.47l32.25 17.124 59.22-9.875 2.843-40.908-37.344-1.718 4.905-17.844 30.78-25.313-25.093-15.625 67.22-38.593-45.345-29.657-66.625 40.187-49.437-15.28c13.812-32.14 35.21-60.22 61.906-82.064l-3.75 44.375 43.376-34.124 72 22.22-22.5-27.407L233 75.562l26.813 28.468 71 9.845-3.5-34.47 41.468 12.657-.905-23.312zm1.156 120.03L278 199.47l28.906 43.218 3.156 64.468L339.25 321l11.438-28.375 62.656 48.656L395.78 294l6.408-48.344-43.75-22.72 10.593-34.155zM221 192.438l-31.594 21.188 36.47 14.78 16.686-14.78L221 192.437zm22.188 144.688 18.687 52.594 19.78-42.564-38.467-10.03z"
          fill="#4a90e2"
          fillOpacity="1"
        ></path>
      </g>
      <g
        fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol"
        fontSize="280"
        fontStyle="normal"
        fontWeight="bold"
        textAnchor="middle"
        textDecoration=" rgba(255, 255, 255, 1)"
        transform="translate(256,300)"
      >
        <g>
          <text stroke="rgba(0, 0, 0, 1)" strokeWidth="45">
            <tspan x="0" y="0">
              3D
            </tspan>
          </text>
          <text fill="rgba(255, 255, 255, 1)">
            <tspan x="0" y="0">
              3D
            </tspan>
          </text>
        </g>
      </g>
    </svg>
  )
}
