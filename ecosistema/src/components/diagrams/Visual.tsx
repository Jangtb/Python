import type { ReactNode } from "react";
import type { VisualKey } from "@/content/types";

/**
 * Diagramas editoriales en SVG. Explican un concepto en lugar de decorar.
 * Todos comparten lienzo 800×500, trazos finos y etiquetas monoespaciadas.
 */

const C = {
  ink: "#202833",
  navy: "#172F46",
  blue: "#397BA9",
  soft: "#91C5E8",
  slate: "#697786",
  slateStrong: "#55626F",
  border: "#D5DCE3",
  paper: "#F3EFE8",
  white: "#FFFFFF",
  tint: "#EEF5FB",
  warm: "#E8E1D6",
};

const mono = { fontFamily: "var(--font-mono)", fontSize: 13, letterSpacing: "0.06em" } as const;
const head = { fontFamily: "var(--font-heading)", fontWeight: 700 } as const;
const display = { fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.02em" } as const;

function Frame({ children, bg = C.paper, label, decorative }: { children: ReactNode; bg?: string; label: string; decorative?: boolean }) {
  return (
    <svg
      className="diagram"
      viewBox="0 0 800 500"
      preserveAspectRatio="xMidYMid meet"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label })}
    >
      <rect width="800" height="500" fill={bg} />
      <DotGrid />
      {children}
    </svg>
  );
}

function DotGrid() {
  const dots: ReactNode[] = [];
  for (let x = 40; x < 800; x += 40) for (let y = 40; y < 500; y += 40) dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill={C.ink} opacity="0.08" />);
  return <g>{dots}</g>;
}

function Arrow({ x1, y1, x2, y2, color = C.ink, dashed }: { x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 9;
  const p1 = `${x2 - s * Math.cos(a - 0.4)},${y2 - s * Math.sin(a - 0.4)}`;
  const p2 = `${x2 - s * Math.cos(a + 0.4)},${y2 - s * Math.sin(a + 0.4)}`;
  return (
    <g stroke={color} fill={color}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.5" strokeDasharray={dashed ? "5 5" : undefined} />
      <polygon points={`${x2},${y2} ${p1} ${p2}`} stroke="none" />
    </g>
  );
}

function NetworkRequest({ decorative }: { decorative?: boolean }) {
  const lanes = [
    { x: 150, label: "TU DISPOSITIVO" },
    { x: 400, label: "SERVIDOR DNS" },
    { x: 650, label: "SERVIDOR WEB" },
  ];
  const steps = [
    { y: 150, from: 150, to: 400, text: "1 · ¿Dirección de este nombre?", back: false },
    { y: 195, from: 400, to: 150, text: "Responde con la IP", back: true },
    { y: 255, from: 150, to: 650, text: "2 · Abrir conexión (TCP/QUIC)", back: false },
    { y: 310, from: 150, to: 650, text: "3 · Acordar cifrado (TLS)", back: false },
    { y: 365, from: 150, to: 650, text: "4 · GET /articulos", back: false },
    { y: 415, from: 650, to: 150, text: "200 OK · HTML", back: true },
  ];
  return (
    <Frame label="Diagrama de secuencia: resolución DNS, conexión, cifrado TLS y petición HTTP entre tu dispositivo y los servidores." decorative={decorative}>
      {lanes.map((l) => (
        <g key={l.x}>
          <rect x={l.x - 78} y={70} width={156} height={40} rx={8} fill={C.white} stroke={C.border} />
          <text x={l.x} y={95} textAnchor="middle" fill={C.ink} style={{ ...mono, fontSize: 12 }}>
            {l.label}
          </text>
          <line x1={l.x} y1={112} x2={l.x} y2={460} stroke={C.slate} strokeDasharray="3 6" opacity="0.6" />
        </g>
      ))}
      {steps.map((s) => {
        const dir = s.to > s.from ? 1 : -1;
        return (
          <g key={s.y}>
            <Arrow x1={s.from + dir * 6} y1={s.y} x2={s.to - dir * 6} y2={s.y} color={s.back ? C.blue : C.ink} dashed={s.back} />
            <text x={(s.from + s.to) / 2} y={s.y - 9} textAnchor="middle" fill={s.back ? C.blue : C.ink} style={{ ...mono, fontSize: 12.5 }}>
              {s.text}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

function CloudLayers({ decorative }: { decorative?: boolean }) {
  const layers = ["Aplicación", "Datos", "Entorno de ejecución", "Sistema operativo", "Virtualización", "Servidores y red"];
  const cols = [
    { name: "IaaS", mine: 4 },
    { name: "PaaS", mine: 2 },
    { name: "SaaS", mine: 0 },
  ];
  return (
    <Frame label="Comparación de IaaS, PaaS y SaaS: qué capas administra la organización y cuáles el proveedor." decorative={decorative}>
      {cols.map((c, ci) => {
        const x = 120 + ci * 210;
        return (
          <g key={c.name}>
            <text x={x + 80} y={66} textAnchor="middle" fill={C.ink} style={{ ...display, fontSize: 26 }}>
              {c.name}
            </text>
            {layers.map((l, li) => {
              const mine = li < c.mine;
              return (
                <g key={l}>
                  <rect x={x} y={88 + li * 52} width={160} height={42} rx={7} fill={mine ? C.white : C.navy} stroke={mine ? C.border : C.navy} />
                  <text x={x + 80} y={114 + li * 52} textAnchor="middle" fill={mine ? C.ink : C.white} style={{ ...mono, fontSize: 11.5 }}>
                    {l.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      <g style={mono}>
        <rect x={120} y={418} width={14} height={14} rx={3} fill={C.white} stroke={C.border} />
        <text x={142} y={430} fill={C.ink}>LO ADMINISTRAS TÚ</text>
        <rect x={360} y={418} width={14} height={14} rx={3} fill={C.navy} />
        <text x={382} y={430} fill={C.ink}>LO ADMINISTRA EL PROVEEDOR</text>
      </g>
    </Frame>
  );
}

function TokenPrediction({ decorative }: { decorative?: boolean }) {
  const options = [
    { w: "mundo", p: 0.62 },
    { w: "futuro", p: 0.21 },
    { w: "trabajo", p: 0.09 },
    { w: "clima", p: 0.03 },
  ];
  return (
    <Frame label="Ejemplo ilustrativo: un modelo de lenguaje asigna probabilidades a posibles continuaciones de una frase." decorative={decorative}>
      <text x={80} y={110} fill={C.ink} style={{ ...display, fontSize: 38 }}>
        La tecnología cambia el
      </text>
      <rect x={498} y={78} width={150} height={44} rx={8} fill={C.tint} stroke={C.blue} strokeDasharray="5 4" />
      <text x={573} y={108} textAnchor="middle" fill={C.blue} style={{ ...mono, fontSize: 16 }}>
        ?
      </text>
      {options.map((o, i) => {
        const y = 175 + i * 62;
        return (
          <g key={o.w}>
            <text x={80} y={y + 24} fill={C.ink} style={{ ...head, fontSize: 20 }}>
              {o.w}
            </text>
            <rect x={230} y={y} width={440} height={34} rx={6} fill={C.white} stroke={C.border} />
            <rect x={230} y={y} width={440 * o.p} height={34} rx={6} fill={i === 0 ? C.blue : C.soft} />
            <text x={690} y={y + 23} fill={C.ink} style={{ ...mono, fontSize: 14 }}>
              {o.p.toFixed(2)}
            </text>
          </g>
        );
      })}
      <text x={80} y={460} fill={C.slateStrong} style={{ ...mono, fontSize: 11 }}>
        PROBABILIDADES ILUSTRATIVAS · NO PROVIENEN DE UN MODELO REAL
      </text>
    </Frame>
  );
}

function AuthFactors({ decorative }: { decorative?: boolean }) {
  const rows = [
    { name: "Solo contraseña", level: 1 },
    { name: "+ código por SMS", level: 2 },
    { name: "+ app de autenticación", level: 3 },
    { name: "Passkey o llave de seguridad", level: 4 },
  ];
  return (
    <Frame label="Escala de protección: de solo contraseña a passkeys y llaves de seguridad." decorative={decorative}>
      <text x={80} y={80} fill={C.slateStrong} style={mono}>
        RESISTENCIA A ROBO DE CREDENCIALES Y PHISHING
      </text>
      {rows.map((r, i) => {
        const y = 120 + i * 82;
        return (
          <g key={r.name}>
            <text x={80} y={y + 30} fill={C.ink} style={{ ...head, fontSize: 19 }}>
              {r.name}
            </text>
            {[0, 1, 2, 3].map((k) => (
              <rect key={k} x={430 + k * 72} y={y + 8} width={62} height={32} rx={6} fill={k < r.level ? (r.level === 4 ? C.navy : C.blue) : C.white} stroke={k < r.level ? "none" : C.border} />
            ))}
          </g>
        );
      })}
    </Frame>
  );
}

function DataInformation({ decorative }: { decorative?: boolean }) {
  const levels = [
    { name: "Sabiduría", ex: "«Conviene adelantar el riego»", w: 220 },
    { name: "Conocimiento", ex: "«Es alta para la fecha»", w: 360 },
    { name: "Información", ex: "«22 °C en Temuco, 14:00»", w: 500 },
    { name: "Dato", ex: "«22»", w: 640 },
  ];
  return (
    <Frame label="Jerarquía de datos, información, conocimiento y sabiduría, con un ejemplo en cada nivel." decorative={decorative}>
      {levels.map((l, i) => {
        const y = 70 + i * 96;
        const x = 400 - l.w / 2;
        return (
          <g key={l.name}>
            <rect x={x} y={y} width={l.w} height={80} rx={10} fill={i === 3 ? C.white : i === 2 ? C.tint : i === 1 ? C.soft : C.navy} stroke={i === 3 ? C.border : "none"} />
            <text x={400} y={y + 34} textAnchor="middle" fill={i === 0 ? C.white : C.ink} style={{ ...head, fontSize: 20 }}>
              {l.name}
            </text>
            <text x={400} y={y + 58} textAnchor="middle" fill={i === 0 ? C.soft : C.slateStrong} style={{ ...mono, fontSize: 12.5 }}>
              {l.ex}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

function EnergyGrid({ decorative }: { decorative?: boolean }) {
  const scale = 0.33;
  const bars = [
    { label: "2024", value: 415, note: "Estimación", fill: C.blue },
    { label: "2030", value: 945, note: "Proyección escenario base", fill: C.navy },
  ];
  return (
    <Frame label="Consumo eléctrico de centros de datos según la AIE: unos 415 TWh en 2024 y una proyección cercana a 945 TWh en 2030." decorative={decorative}>
      <text x={80} y={70} fill={C.slateStrong} style={mono}>
        CONSUMO ELÉCTRICO DE CENTROS DE DATOS · TWh/AÑO · FUENTE: AIE (2025)
      </text>
      <line x1={80} y1={440} x2={720} y2={440} stroke={C.ink} />
      {bars.map((b, i) => {
        const h = b.value * scale;
        const x = 200 + i * 260;
        return (
          <g key={b.label}>
            <rect x={x} y={440 - h} width={140} height={h} rx={6} fill={b.fill} />
            <text x={x + 70} y={440 - h - 16} textAnchor="middle" fill={C.ink} style={{ ...display, fontSize: 34 }}>
              ~{b.value}
            </text>
            <text x={x + 70} y={468} textAnchor="middle" fill={C.ink} style={{ ...head, fontSize: 16 }}>
              {b.label}
            </text>
            <text x={x + 70} y={488} textAnchor="middle" fill={C.slateStrong} style={{ ...mono, fontSize: 11 }}>
              {b.note.toUpperCase()}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

function Medallion({ decorative }: { decorative?: boolean }) {
  const stages = [
    { name: "Fuentes", sub: "ERP · CRM · archivos", fill: C.white, text: C.ink },
    { name: "Bronze", sub: "datos crudos, trazables", fill: "#E9DCC6", text: C.ink },
    { name: "Silver", sub: "limpios y conformados", fill: "#DDE3E9", text: C.ink },
    { name: "Gold", sub: "listos para el negocio", fill: C.navy, text: C.white },
  ];
  return (
    <Frame label="Arquitectura medallion: de las fuentes a las capas bronze, silver y gold." bg={C.white} decorative={decorative}>
      {stages.map((s, i) => {
        const x = 50 + i * 185;
        return (
          <g key={s.name}>
            <rect x={x} y={170} width={150} height={150} rx={14} fill={s.fill} stroke={i === 0 ? C.border : "none"} />
            <text x={x + 75} y={240} textAnchor="middle" fill={s.text} style={{ ...display, fontSize: 26 }}>
              {s.name}
            </text>
            <text x={x + 75} y={268} textAnchor="middle" fill={s.text === C.white ? C.soft : C.slateStrong} style={{ ...mono, fontSize: 10.5 }}>
              {s.sub.toUpperCase()}
            </text>
            {i < stages.length - 1 && <Arrow x1={x + 156} y1={245} x2={x + 179} y2={245} />}
          </g>
        );
      })}
      <text x={50} y={120} fill={C.slateStrong} style={mono}>
        CADA CAPA TIENE UNA RESPONSABILIDAD Y REGLAS DE CALIDAD PROPIAS
      </text>
      <text x={50} y={390} fill={C.slateStrong} style={mono}>
        GOBIERNO · CALIDAD · LINAJE · SEGURIDAD — TRANSVERSALES A TODAS LAS CAPAS
      </text>
      <line x1={50} y1={360} x2={750} y2={360} stroke={C.blue} strokeWidth="2" />
    </Frame>
  );
}

function GovernanceLoop({ decorative }: { decorative?: boolean }) {
  const steps = [
    { name: "Definir", sub: "significado y responsable", x: 400, y: 95 },
    { name: "Medir", sub: "reglas de calidad", x: 640, y: 250 },
    { name: "Mejorar", sub: "corregir en el origen", x: 400, y: 405 },
    { name: "Comunicar", sub: "estado visible", x: 160, y: 250 },
  ];
  return (
    <Frame label="Ciclo de gobierno y calidad de datos: definir, medir, mejorar y comunicar." bg={C.white} decorative={decorative}>
      <circle cx={400} cy={250} r={155} fill="none" stroke={C.border} strokeWidth="1.5" strokeDasharray="4 6" />
      <text x={400} y={244} textAnchor="middle" fill={C.ink} style={{ ...display, fontSize: 24 }}>
        Datos críticos
      </text>
      <text x={400} y={270} textAnchor="middle" fill={C.slateStrong} style={{ ...mono, fontSize: 11 }}>
        EMPEZAR POR POCOS
      </text>
      {steps.map((s, i) => (
        <g key={s.name}>
          <rect x={s.x - 85} y={s.y - 32} width={170} height={64} rx={12} fill={i === 0 ? C.navy : C.white} stroke={i === 0 ? "none" : C.border} />
          <text x={s.x} y={s.y - 4} textAnchor="middle" fill={i === 0 ? C.white : C.ink} style={{ ...head, fontSize: 17 }}>
            {s.name}
          </text>
          <text x={s.x} y={s.y + 18} textAnchor="middle" fill={i === 0 ? C.soft : C.slateStrong} style={{ ...mono, fontSize: 10.5 }}>
            {s.sub.toUpperCase()}
          </text>
        </g>
      ))}
    </Frame>
  );
}

/** Diagrama principal del ecosistema: el ciclo entre las tres iniciativas. */
export function EcosystemDiagram() {
  const nodes = [
    { x: 240, y: 92, name: "Datos con Datos", verb: "EXPLICA", fill: C.blue },
    { x: 400, y: 330, name: "Comunidad", verb: "CONECTA", fill: "#2F6F9C" },
    { x: 80, y: 330, name: "Consultoría", verb: "ASESORA", fill: C.navy },
  ];
  const flows = [
    { from: 0, to: 1, label: "atrae personas", lx: 322, ly: 196, anchor: "start" as const },
    { from: 1, to: 2, label: "comparte desafíos", lx: 240, ly: 368, anchor: "middle" as const },
    { from: 2, to: 0, label: "devuelve aprendizajes", lx: 158, ly: 196, anchor: "end" as const },
  ];
  const shorten = (a: { x: number; y: number }, b: { x: number; y: number }, r: number) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    return { x1: a.x + ((b.x - a.x) / d) * r, y1: a.y + ((b.y - a.y) / d) * r, x2: b.x - ((b.x - a.x) / d) * r, y2: b.y - ((b.y - a.y) / d) * r };
  };
  return (
    <svg
      className="diagram"
      viewBox="0 0 480 420"
      role="img"
      aria-label="Ciclo del ecosistema: Datos con Datos atrae personas a la Comunidad; la Comunidad comparte desafíos que aborda la Consultoría; la Consultoría devuelve aprendizajes a Datos con Datos."
    >
      <circle cx={240} cy={250} r={70} fill={C.tint} />
      <text x={240} y={246} textAnchor="middle" fill={C.ink} style={{ ...display, fontSize: 18 }}>
        Personas
      </text>
      <text x={240} y={266} textAnchor="middle" fill={C.slateStrong} style={{ ...mono, fontSize: 10 }}>
        + DATOS
      </text>
      {flows.map((f) => {
        const a = nodes[f.from]!;
        const b = nodes[f.to]!;
        const s = shorten(a, b, 44);
        return (
          <g key={f.label}>
            <Arrow {...s} color={C.slate} />
            <text x={f.lx} y={f.ly} textAnchor={f.anchor} fill={C.slateStrong} style={{ ...mono, fontSize: 10.5 }}>
              {f.label.toUpperCase()}
            </text>
          </g>
        );
      })}
      {nodes.map((n) => (
        <g key={n.name}>
          <circle cx={n.x} cy={n.y} r={36} fill={n.fill} />
          <circle cx={n.x} cy={n.y} r={6} fill={C.white} />
          <text x={n.x} y={n.y + (n.y < 200 ? -50 : 58)} textAnchor="middle" fill={C.ink} style={{ ...head, fontSize: 15 }}>
            {n.name}
          </text>
          <text x={n.x} y={n.y + (n.y < 200 ? -68 : 76)} textAnchor="middle" fill={C.blue} style={{ ...mono, fontSize: 10 }}>
            {n.verb}
          </text>
        </g>
      ))}
    </svg>
  );
}

const registry: Record<VisualKey, (p: { decorative?: boolean }) => ReactNode> = {
  "network-request": NetworkRequest,
  "cloud-layers": CloudLayers,
  "token-prediction": TokenPrediction,
  "auth-factors": AuthFactors,
  "data-information": DataInformation,
  "energy-grid": EnergyGrid,
  medallion: Medallion,
  "governance-loop": GovernanceLoop,
  ecosystem: () => <EcosystemDiagram />,
};

export function Visual({ name, decorative = false }: { name: VisualKey; decorative?: boolean }) {
  const Component = registry[name];
  return <Component decorative={decorative} />;
}
