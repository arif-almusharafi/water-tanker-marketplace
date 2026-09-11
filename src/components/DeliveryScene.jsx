export default function DeliveryScene() {
  return (
    <div className="delivery-scene">
      <svg
        viewBox="0 0 650 490"
        role="img"
        aria-label="وايت موية في طريقه إلى منزل سعودي بخزان ماء"
      >
        <defs>
          <linearGradient id="ground" x2="0" y2="1">
            <stop stopColor="#e0f5fb" />
            <stop offset="1" stopColor="#f1fbff" />
          </linearGradient>
          <linearGradient id="tank" x2="0" y2="1">
            <stop stopColor="#fff" />
            <stop offset=".5" stopColor="#e4f5fd" />
            <stop offset="1" stopColor="#b0dbf1" />
          </linearGradient>
          <linearGradient id="cab" x2="0" y2="1">
            <stop stopColor="#158bdd" />
            <stop offset="1" stopColor="#0760b7" />
          </linearGradient>
        </defs>
        <circle cx="337" cy="239" r="205" fill="#e5f6fc" />
        <circle
          cx="337"
          cy="239"
          r="172"
          fill="none"
          stroke="#d2eef8"
          strokeDasharray="5 9"
        />
        <path d="M26 334 332 198 632 338 329 480Z" fill="url(#ground)" />
        <path d="m61 359 242-105 257 119-239 108Z" fill="#d1e8ee" />
        <path
          d="m72 361 232-96 244 109"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeDasharray="15 12"
        />
        <path d="m382 167 102-41 103 45-101 45Z" fill="#f8fcfc" />
        <path d="m382 167 104 48v119l-104-49Z" fill="#c6dfeb" />
        <path d="m486 215 101-44v119l-101 44Z" fill="#e5eef0" />
        <path d="m371 157 109-44 119 51-112 50Z" fill="#fff" />
        <path d="m371 157 116 50v14l-116-51Z" fill="#afcdda" />
        <path d="m487 207 112-43v14l-112 43Z" fill="#d9e8eb" />
        <path d="m508 236 31-13v71l-31 14Z" fill="#8facb6" />
        <path d="m550 218 22-10v34l-22 10Z" fill="#91cadf" />
        <path
          d="m401 202 25 12v31l-25-12Z M445 222l25 12v31l-25-12Z"
          fill="#6ba4bc"
        />
        <path
          d="m445 222 12 6v31l-12-6Z M401 202l12 6v31l-12-6Z"
          fill="#9ac8d8"
        />
        <path d="M476 115v41c0 17 50 17 50 0v-41" fill="#bddce9" />
        <ellipse cx="501" cy="115" rx="25" ry="10" fill="#fff" />
        <ellipse
          cx="501"
          cy="156"
          rx="25"
          ry="9"
          fill="none"
          stroke="#a4ccdd"
        />
        <path
          d="M479 131q22 10 44 0m-44 12q22 10 44 0"
          fill="none"
          stroke="#e6f4f8"
          strokeWidth="3"
        />
        <path
          d="m419 293-54 24 66 33-77 34"
          fill="none"
          stroke="#1396dd"
          strokeWidth="3"
          strokeDasharray="7 6"
        />
        <ellipse
          cx="263"
          cy="392"
          rx="152"
          ry="29"
          fill="#80b2c9"
          opacity=".16"
        />
        <path d="m125 322 176-70 119 58-176 78Z" fill="#16496c" />
        <path d="m125 322 119 57v24l-119-57Z" fill="#146db1" />
        <path d="m244 379 176-69v24l-176 69Z" fill="#084c84" />
        <g fill="#203c51" stroke="#314d61" strokeWidth="7">
          <ellipse
            cx="163"
            cy="355"
            rx="17"
            ry="25"
            transform="rotate(-21 163 355)"
          />
          <ellipse
            cx="274"
            cy="390"
            rx="18"
            ry="26"
            transform="rotate(20 274 390)"
          />
          <ellipse
            cx="378"
            cy="348"
            rx="18"
            ry="26"
            transform="rotate(20 378 348)"
          />
        </g>
        <g fill="#a2b9c6">
          <ellipse
            cx="164"
            cy="355"
            rx="8"
            ry="13"
            transform="rotate(-21 164 355)"
          />
          <ellipse
            cx="275"
            cy="390"
            rx="8"
            ry="13"
            transform="rotate(20 275 390)"
          />
          <ellipse
            cx="379"
            cy="348"
            rx="8"
            ry="13"
            transform="rotate(20 379 348)"
          />
        </g>
        <path
          d="M141 309c-39-19-30-70 0-83l101-43c44-19 104 42 65 68l-105 65c-22 12-42 4-61-7Z"
          fill="url(#tank)"
          stroke="#a4cfe2"
          strokeWidth="1.5"
        />
        <ellipse
          cx="166"
          cy="267"
          rx="39"
          ry="49"
          transform="rotate(-35 166 267)"
          fill="#e6f5fc"
          stroke="#b8dbea"
          strokeWidth="3"
        />
        <path
          d="M165 220c31 7 56 46 42 77m-7-91c31 7 57 45 42 76m-6-91c31 7 56 44 42 74"
          fill="none"
          stroke="#9dcce1"
          strokeWidth="4"
        />
        <path d="m131 264 53 25" stroke="#0587d4" strokeWidth="13" />
        <path
          d="m229 283 76-31 3-57 34-13 59 29 20 46v57l-110 48-82-39Z"
          fill="url(#cab)"
        />
        <path d="m307 195 34-13 59 29-39 17Z" fill="#49a9e7" />
        <path d="m361 228 39-17 17 41-56 24Z" fill="#b7e4f3" />
        <path d="m311 209 36 17v47l-36-17Z" fill="#c4edfa" />
        <path d="m319 216 19 10v31l-19-9Z" fill="#80bfdc" />
        <path d="m360 286 60-24v53l-60 24Z" fill="#0875c7" />
        <path d="m370 296 34-14v11l-34 14Z" fill="#144975" />
        <path d="m360 326 59-24v10l-59 24Z" fill="#cadfe8" />
        <path d="m364 282 13-5v9l-13 5Z m39-16 13-5v9l-13 5Z" fill="#fff4bb" />
        <path d="m316 278 12 5v4l-12-5Z" fill="#063e77" />
        <text
          x="270"
          y="296"
          fill="white"
          fontFamily="Arial"
          fontSize="23"
          fontWeight="bold"
          transform="rotate(-23 270 296)"
        >
          موية
        </text>
        <path
          d="M104 309v-69m0 6c-24-5-29-17-30-25 16 0 26 6 30 19m0 8c24-8 29-23 26-29-16 4-24 14-26 24m0-5c-7-19-3-29 3-36 9 13 8 25-3 36"
          stroke="#73b0a2"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M575 335v-67m0 5c-22-6-28-18-26-25 16 1 24 9 26 23m0 3c22-6 30-19 27-27-16 2-24 13-27 24m0-2c-8-17-5-29 1-35 10 12 10 24-1 35"
          stroke="#79b7a7"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        <g fill="white">
          <path d="M167 125h62a16 16 0 00-31-7 12 12 0 00-23 0 9 9 0 00-8 7Z" />
          <path d="M358 83h48a12 12 0 00-22-6 10 10 0 00-18 0Z" />
        </g>
      </svg>
      <div className="scene-label arrival">
        <span className="label-icon">
          <Truck size={21} />
        </span>
        <div>
          <small>في الطريق إليك</small>
          <strong>يوصلك خلال ٢٥ دقيقة</strong>
        </div>
        <span className="live-dot" />
      </div>
      <div className="scene-label quality">
        <span className="quality-star">✦</span>
        <div>
          <strong>مياه نقية، موردون موثوقون</strong>
          <small>راحة بالك تبدأ مع موية</small>
        </div>
      </div>
      <span className="scene-dot dot-one" />
      <span className="scene-dot dot-two" />
    </div>
  );
}
import { Truck } from "lucide-react";
