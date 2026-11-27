import { randomBytes, randomUUID } from "node:crypto";
import { emptyDatabase, type Database, type Thread, type Comment } from "./types";

/**
 * Datos de demostración. TODO el contenido sembrado está marcado con
 * isDemo = true y se muestra con la etiqueta "Ejemplo" en la interfaz.
 * Los autores son perfiles ficticios explícitos (correo @demo.invalid,
 * sin contraseña utilizable). Desactivar con SEED_DEMO=false.
 */
export function buildSeed(now: Date): Database {
  const db = emptyDatabase();
  const iso = (d: Date) => d.toISOString();
  const daysAgo = (n: number, h = 0) => new Date(now.getTime() - n * 86_400_000 - h * 3_600_000);
  const daysAhead = (n: number, utcHour: number) => {
    const d = new Date(now.getTime() + n * 86_400_000);
    d.setUTCHours(utcHour, 0, 0, 0);
    return d;
  };

  const personas = [
    { handle: "ejemplo-gobierno", name: "Perfil de ejemplo · Gobierno", specialty: "Gobierno de datos" },
    { handle: "ejemplo-arquitectura", name: "Perfil de ejemplo · Arquitectura", specialty: "Arquitectura de datos" },
    { handle: "ejemplo-calidad", name: "Perfil de ejemplo · Calidad", specialty: "Data Quality" },
    { handle: "ejemplo-analitica", name: "Perfil de ejemplo · Analítica", specialty: "Analítica y BI" },
  ];

  const userIds = personas.map((p, i) => {
    const id = randomUUID();
    db.users.push({
      id,
      email: `${p.handle}@demo.invalid`,
      // Hash inválido a propósito: estas cuentas no pueden iniciar sesión.
      passwordHash: `disabled:${randomBytes(16).toString("hex")}`,
      role: "member",
      status: "active",
      emailVerifiedAt: iso(daysAgo(60)),
      trustLevel: 1,
      createdAt: iso(daysAgo(60 - i)),
    });
    db.profiles.push({
      userId: id,
      handle: p.handle,
      displayName: p.name,
      bio: "Perfil ficticio creado para mostrar cómo se ve la comunidad con actividad. No representa a una persona real.",
      specialty: p.specialty,
      interests: [p.specialty],
      organization: null,
      links: [],
      updatedAt: iso(daysAgo(60)),
    });
    return id;
  });
  const [gob, arq, cal, ana] = userIds as [string, string, string, string];

  const thread = (t: Partial<Thread> & Pick<Thread, "title" | "body" | "categorySlug" | "authorId">, ageDays: number): Thread => {
    const created = daysAgo(ageDays, 3);
    const row: Thread = {
      id: randomUUID(),
      kind: "discussion",
      tags: [],
      proposalType: null,
      status: "open",
      moderation: "published",
      solutionCommentId: null,
      locked: false,
      isDemo: true,
      createdAt: iso(created),
      updatedAt: iso(created),
      lastActivityAt: iso(created),
      ...t,
    };
    db.threads.push(row);
    return row;
  };

  const comment = (threadRow: Thread, authorId: string, body: string, ageDays: number): Comment => {
    const c: Comment = {
      id: randomUUID(),
      threadId: threadRow.id,
      parentId: null,
      authorId,
      body,
      moderation: "published",
      isDemo: true,
      createdAt: iso(daysAgo(ageDays)),
    };
    db.comments.push(c);
    threadRow.lastActivityAt = c.createdAt;
    if (threadRow.status === "open") threadRow.status = "discussion";
    return c;
  };

  const vote = (t: Thread, ...ids: string[]) => ids.forEach((userId) => db.votes.push({ threadId: t.id, userId, createdAt: t.createdAt }));

  // — Discusiones —
  const t1 = thread(
    {
      title: "¿Cómo implementar un modelo de gobierno de datos en una empresa que todavía no tiene una arquitectura definida?",
      body:
        "Trabajo en una empresa mediana donde los datos viven en planillas, un ERP y dos sistemas comerciales. No existe un data warehouse ni un equipo de datos formal.\n\nLa gerencia quiere \"gobierno de datos\", pero temo que si partimos por políticas y comités terminemos con documentos que nadie usa.\n\n¿Por dónde empezarían? ¿Tiene sentido definir roles antes que la arquitectura?",
      categorySlug: "gobierno-de-datos",
      tags: ["modelo operativo", "roles", "primeros pasos"],
      authorId: ana,
    },
    9,
  );
  comment(
    t1,
    gob,
    "Partiría por dos o tres datos críticos para el negocio (por ejemplo, cliente y producto) y definiría para ellos un responsable, una definición acordada y una regla de calidad mínima. Eso ya es gobierno, y no depende de tener la arquitectura final.",
    8,
  );
  comment(
    t1,
    arq,
    "Coincido. La arquitectura puede evolucionar en paralelo: lo importante es que las decisiones de modelado de esos datos críticos se tomen con sus responsables. Si después llega un lakehouse, el glosario y los responsables siguen sirviendo.",
    7,
  );
  vote(t1, gob, arq, cal);

  const t2 = thread(
    {
      title: "¿Qué reglas de calidad conviene automatizar primero en un pipeline nuevo?",
      body:
        "Estamos construyendo la primera versión de un pipeline de ventas. Tenemos tiempo limitado y no podemos cubrir todo.\n\n¿Qué validaciones priorizarían en la primera iteración?",
      categorySlug: "data-quality",
      tags: ["pipelines", "validaciones"],
      authorId: arq,
    },
    15,
  );
  const sol = comment(
    t2,
    cal,
    "En orden: (1) completitud de claves y campos obligatorios, (2) unicidad de la clave de negocio, (3) frescura: que la carga llegue en la ventana esperada, y (4) volumen dentro de un rango razonable respecto al día anterior. Esas cuatro detectan la mayoría de los incidentes de una primera versión.",
    14,
  );
  comment(t2, ana, "Agrego: dejar visible el resultado de las validaciones para quienes consumen los datos. Si el reporte muestra que la carga de hoy falló, se evita tomar decisiones con datos incompletos.", 13);
  t2.status = "resolved";
  t2.solutionCommentId = sol.id;
  vote(t2, gob, cal, ana);

  thread(
    {
      title: "Arquitectura medallion: ¿cuándo vale la pena separar la capa Gold por dominio?",
      body:
        "Tenemos Bronze y Silver estables. Para Gold, algunos proponen una sola capa compartida y otros una por dominio (finanzas, comercial, operaciones).\n\n¿Qué criterios usan para decidir?",
      categorySlug: "arquitectura-de-datos",
      tags: ["medallion", "lakehouse", "data products"],
      authorId: gob,
    },
    3,
  );

  const t4 = thread(
    {
      title: "¿Cómo explicar el valor de un catálogo de datos a la gerencia?",
      body:
        "Tenemos la herramienta, pero cuesta conseguir tiempo de las áreas para documentar. Busco argumentos concretos, no promesas genéricas.",
      categorySlug: "estrategia-y-negocio",
      tags: ["catálogo", "adopción"],
      authorId: cal,
    },
    5,
  );
  comment(
    t4,
    ana,
    "Lo que me ha funcionado es medir el tiempo que hoy se pierde buscando o validando datos: preguntar a cinco analistas cuántas horas a la semana dedican a eso. Es un número que la gerencia entiende.",
    4,
  );
  vote(t4, ana);

  thread(
    {
      title: "Primeros pasos para pasar de analista BI a ingeniería de datos",
      body: "Llevo tres años con Power BI y SQL. ¿Qué conviene aprender primero para dar el paso a ingeniería de datos?",
      categorySlug: "carrera-y-desarrollo",
      tags: ["carrera", "aprendizaje"],
      authorId: ana,
    },
    1,
  );

  // — Propuestas —
  const p1 = thread(
    {
      kind: "proposal",
      proposalType: "recurso",
      title: "Guía abierta en español sobre Data Contracts",
      body:
        "Propongo redactar entre varios una guía práctica en español: qué es un contrato de datos, qué campos mínimos debería tener y ejemplos para casos comunes (ventas, clientes, inventario).\n\nPodríamos publicarla en el sitio como recurso de la comunidad.",
      categorySlug: "data-management",
      tags: ["data contracts", "colaborativo"],
      authorId: cal,
    },
    11,
  );
  comment(p1, arq, "Me sumo. Podría aportar ejemplos de versionado y de cómo manejar cambios que rompen compatibilidad.", 10);
  vote(p1, gob, arq, ana);

  const p2 = thread(
    {
      kind: "proposal",
      proposalType: "encuentro",
      title: "Ciclo de conversatorios sobre gobierno de datos en el sector público",
      body: "Una conversación mensual, online, para compartir cómo distintas instituciones están abordando la gestión de sus datos.",
      categorySlug: "gobierno-de-datos",
      tags: ["sector público", "conversatorio"],
      authorId: gob,
    },
    6,
  );
  vote(p2, cal);

  thread(
    {
      kind: "proposal",
      proposalType: "herramienta",
      title: "Plantilla comunitaria para diagnosticar la madurez de datos",
      body: "Una planilla simple, con preguntas por dimensión (gobierno, calidad, arquitectura, cultura), que cualquier equipo pueda usar para un primer diagnóstico.",
      categorySlug: "estrategia-y-negocio",
      tags: ["madurez", "plantilla"],
      authorId: arq,
    },
    2,
  );

  // — Eventos (fechas futuras relativas a la creación de la base) —
  const evt = (e: Omit<Database["events"][number], "id" | "isDemo" | "createdAt" | "createdBy" | "status">) =>
    db.events.push({ ...e, id: randomUUID(), status: "published", isDemo: true, createdBy: null, createdAt: iso(now) });

  const s1 = daysAhead(14, 22);
  evt({
    slug: "conversatorio-gobierno-de-datos-sin-burocracia",
    title: "Gobierno de datos sin burocracia",
    summary: "Conversatorio abierto sobre cómo empezar a gobernar datos con pocos recursos y resultados visibles.",
    description:
      "Una conversación práctica sobre los primeros pasos de un programa de gobierno de datos: cómo elegir los datos críticos, definir responsables y evitar que el esfuerzo se transforme en documentación que nadie usa.\n\nIncluye un espacio de preguntas abiertas.",
    format: "conversatorio",
    modality: "online",
    startsAt: iso(s1),
    endsAt: iso(new Date(s1.getTime() + 90 * 60_000)),
    timezone: "America/Santiago",
    location: null,
    onlineUrl: null,
    organizer: "Comunidad de Datos",
    capacity: 80,
  });

  const s2 = daysAhead(32, 21);
  evt({
    slug: "workshop-calidad-de-datos-en-la-practica",
    title: "Calidad de datos en la práctica",
    summary: "Workshop guiado: definir, medir y comunicar reglas de calidad sobre un caso real.",
    description:
      "Trabajaremos sobre un conjunto de datos de ejemplo para definir reglas de calidad, priorizarlas según impacto y diseñar cómo comunicar los resultados a quienes consumen los datos.\n\nSe recomienda conocimiento básico de SQL.",
    format: "workshop",
    modality: "online",
    startsAt: iso(s2),
    endsAt: iso(new Date(s2.getTime() + 120 * 60_000)),
    timezone: "America/Santiago",
    location: null,
    onlineUrl: null,
    organizer: "Comunidad de Datos",
    capacity: 30,
  });

  const s3 = daysAhead(50, 22);
  evt({
    slug: "meetup-datos-santiago",
    title: "Meetup de la Comunidad de Datos",
    summary: "Encuentro presencial para conocernos, presentar proyectos breves y conversar.",
    description: "Tres presentaciones breves de miembros de la comunidad y un espacio de networking. El lugar se confirmará a las personas inscritas.",
    format: "meetup",
    modality: "presencial",
    startsAt: iso(s3),
    endsAt: iso(new Date(s3.getTime() + 150 * 60_000)),
    timezone: "America/Santiago",
    location: "Santiago (lugar por confirmar)",
    onlineUrl: null,
    organizer: "Comunidad de Datos",
    capacity: 40,
  });

  return db;
}
