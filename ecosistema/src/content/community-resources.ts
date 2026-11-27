import type { ExternalResource } from "./types";

/**
 * Referencias externas curadas para la comunidad. Son enlaces a material
 * público de terceros; la comunidad propone nuevos recursos desde
 * /comunidad/propuestas (tipo "Recurso compartido").
 */
export const communityResources: ExternalResource[] = [
  {
    title: "DAMA Body of Knowledge (DMBOK)",
    publisher: "DAMA International",
    url: "https://www.dama.org/cpages/body-of-knowledge",
    description: "Marco de referencia más difundido para la gestión de datos: gobierno, calidad, metadatos, arquitectura y más.",
    kind: "marco de referencia",
    topic: "Gobierno de Datos",
  },
  {
    title: "Medallion Architecture",
    publisher: "Databricks",
    url: "https://www.databricks.com/glossary/medallion-architecture",
    description: "Descripción del patrón de capas bronze, silver y gold para organizar un lakehouse.",
    kind: "documentación",
    topic: "Arquitectura de Datos",
  },
  {
    title: "Documentación de Microsoft Purview",
    publisher: "Microsoft",
    url: "https://learn.microsoft.com/en-us/purview/",
    description: "Catálogo, linaje, clasificación y protección de datos en la plataforma de Microsoft.",
    kind: "documentación",
    topic: "Data Management",
  },
  {
    title: "OpenLineage",
    publisher: "LF AI & Data Foundation",
    url: "https://openlineage.io/",
    description: "Estándar abierto para recolectar metadatos de linaje desde pipelines y herramientas.",
    kind: "estándar",
    topic: "Data Management",
  },
  {
    title: "Delta Lake",
    publisher: "Linux Foundation",
    url: "https://docs.delta.io/",
    description: "Formato de tabla abierto con transacciones ACID sobre almacenamiento de objetos.",
    kind: "documentación",
    topic: "Ingeniería de Datos",
  },
  {
    title: "dbt Docs",
    publisher: "dbt Labs",
    url: "https://docs.getdbt.com/",
    description: "Transformación de datos con SQL, pruebas y documentación como código.",
    kind: "herramienta",
    topic: "Ingeniería de Datos",
  },
  {
    title: "NIST Privacy Framework",
    publisher: "NIST",
    url: "https://www.nist.gov/privacy-framework",
    description: "Herramienta para identificar y gestionar riesgos de privacidad en organizaciones.",
    kind: "marco de referencia",
    topic: "Seguridad y privacidad",
  },
  {
    title: "Datos abiertos del Estado de Chile",
    publisher: "Gobierno de Chile",
    url: "https://datos.gob.cl/",
    description: "Conjuntos de datos públicos útiles para practicar, investigar y construir prototipos.",
    kind: "datos abiertos",
    topic: "Analítica y BI",
  },
];
