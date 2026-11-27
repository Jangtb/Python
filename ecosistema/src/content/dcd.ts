import type { Article, Author, ExternalResource, GlossaryTerm, Pillar } from "./types";

export const pillars: Pillar[] = [
  {
    slug: "tecnologia-en-nuestra-vida",
    number: "01",
    name: "Tecnología en nuestra vida",
    description: "Lo que ocurre detrás de las herramientas que usamos todos los días.",
  },
  {
    slug: "herramientas-y-dispositivos",
    number: "02",
    name: "Herramientas y dispositivos",
    description: "Cómo funcionan, cómo elegirlos y cómo sacarles partido con criterio.",
  },
  {
    slug: "ia-y-nuevas-tecnologias",
    number: "03",
    name: "Inteligencia artificial y nuevas tecnologías",
    description: "Qué pueden hacer, qué no, y cómo usarlas con pensamiento crítico.",
  },
  {
    slug: "seguridad-y-ciudadania-digital",
    number: "04",
    name: "Seguridad, privacidad y ciudadanía digital",
    description: "Proteger nuestra información y ejercer nuestros derechos en línea.",
  },
  {
    slug: "ciencia-y-conocimiento",
    number: "05",
    name: "Ciencia y conocimiento tecnológico",
    description: "Las ideas y los conceptos que sostienen el mundo digital.",
  },
  {
    slug: "tecnologia-y-sociedad",
    number: "06",
    name: "Tecnología y futuro de la sociedad",
    description: "Los efectos de la tecnología en el trabajo, el ambiente y la vida en común.",
  },
];

const redaccion: Author = { name: "Redacción DCD", role: "Equipo editorial de Datos con Datos" };

export const articles: Article[] = [
  {
    slug: "que-pasa-cuando-abres-una-pagina-web",
    title: "¿Qué pasa realmente cuando abres una página web?",
    excerpt:
      "Entre que escribes una dirección y ves la página pasan menos de dos segundos. En ese tiempo ocurren al menos cuatro conversaciones entre máquinas. Te las contamos paso a paso.",
    pillar: "tecnologia-en-nuestra-vida",
    tags: ["internet", "navegadores", "fundamentos"],
    publishedAt: "2026-11-18",
    author: redaccion,
    visual: "network-request",
    featured: true,
    blocks: [
      {
        type: "p",
        text: "Abrir una página web parece un gesto instantáneo. Pero detrás de ese clic hay una cadena de pasos bien definidos, acordados en estándares públicos, que permiten que computadores de distintos fabricantes, países y épocas se entiendan entre sí. Comprenderlos ayuda a entender por qué una página tarda, por qué a veces falla y qué significa ese candado junto a la dirección.",
      },
      { type: "h2", id: "nombres-y-direcciones", text: "1. De un nombre a una dirección" },
      {
        type: "p",
        text: "Las personas recordamos nombres como *datoscondatos.cl*, pero los computadores se ubican mediante **direcciones IP**, números del tipo 192.0.2.10. El primer paso es traducir el nombre a una dirección. De eso se encarga el **DNS** (Domain Name System), que funciona como una guía telefónica distribuida por todo el mundo.",
      },
      {
        type: "p",
        text: "Tu dispositivo pregunta primero a un servidor de resolución (normalmente el de tu proveedor de internet). Si no conoce la respuesta, este consulta a otros servidores en cadena hasta dar con el que tiene la información oficial del dominio. La respuesta se guarda por un tiempo para no repetir la búsqueda en cada visita.",
      },
      { type: "h2", id: "conexion", text: "2. Abrir una conexión" },
      {
        type: "p",
        text: "Con la dirección en la mano, el navegador establece una conexión con el servidor. Tradicionalmente se usa **TCP**, un protocolo que garantiza que los datos lleguen completos y en orden, reenviando lo que se pierda en el camino. Las versiones más recientes de la web también pueden usar **QUIC**, diseñado para establecer conexiones más rápido.",
      },
      { type: "h2", id: "cifrado", text: "3. Ponerse de acuerdo para hablar en privado" },
      {
        type: "p",
        text: "Si la dirección empieza con *https*, antes de intercambiar contenido el navegador y el servidor negocian una conexión cifrada mediante **TLS**. El servidor presenta un certificado emitido por una autoridad reconocida, que acredita que controla ese dominio. Luego ambos acuerdan claves para cifrar todo lo que viajará entre ellos.",
      },
      {
        type: "callout",
        title: "Lo que el candado sí y no significa",
        text: "El candado indica que la conexión está cifrada y que el certificado corresponde al dominio que visitas. **No** garantiza que el sitio sea honesto: un sitio fraudulento también puede tener su candado. Revisa siempre que el dominio sea exactamente el que esperas.",
      },
      { type: "h2", id: "pedir-la-pagina", text: "4. Pedir la página y recibirla" },
      {
        type: "p",
        text: "Ahora sí, el navegador envía una **petición HTTP**: un mensaje breve que dice, en esencia, \"quiero el recurso /articulos\". El servidor responde con un código de estado (200 si todo salió bien, 404 si no existe, 500 si falló algo de su lado) y el contenido, normalmente un documento HTML.",
      },
      {
        type: "figure",
        visual: "network-request",
        caption: "Secuencia simplificada: resolución DNS, conexión, cifrado TLS y petición HTTP. Cada flecha es un intercambio de mensajes entre tu dispositivo y otros servidores.",
      },
      { type: "h2", id: "dibujar", text: "5. Dibujar lo que ves" },
      {
        type: "p",
        text: "El HTML describe la estructura de la página, pero rara vez viene solo. Al leerlo, el navegador descubre que necesita hojas de estilo, tipografías, imágenes y programas en JavaScript, y los pide —a veces a otros servidores—. Con todo eso construye la página, calcula dónde va cada elemento y la pinta en pantalla.",
      },
      {
        type: "p",
        text: "Por eso una página puede \"aparecer\" antes de estar completa, o verse rota si uno de esos recursos no llega. Y por eso muchas organizaciones usan **redes de distribución de contenido** (CDN): copias de sus archivos repartidas por el mundo para que viajen menos distancia.",
      },
      { type: "h2", id: "por-que-importa", text: "Por qué vale la pena saberlo" },
      {
        type: "ul",
        items: [
          "**Diagnosticar mejor:** si una página no carga pero otras sí, el problema probablemente no es tu conexión.",
          "**Protegerte:** entender qué certifica el candado ayuda a reconocer intentos de suplantación.",
          "**Exigir calidad:** una página que pide cientos de recursos externos será lenta, sobre todo en redes móviles.",
        ],
      },
    ],
    sources: [
      { title: "What is DNS? How DNS works", publisher: "Cloudflare Learning Center", url: "https://www.cloudflare.com/learning/dns/what-is-dns/" },
      { title: "RFC 9110: HTTP Semantics", publisher: "IETF", url: "https://www.rfc-editor.org/rfc/rfc9110", year: "2022" },
      { title: "RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3", publisher: "IETF", url: "https://www.rfc-editor.org/rfc/rfc8446", year: "2018" },
      { title: "RFC 9000: QUIC, a UDP-Based Multiplexed and Secure Transport", publisher: "IETF", url: "https://www.rfc-editor.org/rfc/rfc9000", year: "2021" },
    ],
  },
  {
    slug: "que-significa-que-algo-este-en-la-nube",
    title: "Qué significa realmente que algo esté \"en la nube\"",
    excerpt:
      "La nube no es un lugar etéreo: son centros de datos muy concretos. Lo que cambia es quién los administra y cómo los pagas. Una guía para entender el concepto y tomar mejores decisiones.",
    pillar: "herramientas-y-dispositivos",
    tags: ["nube", "fundamentos", "decisiones"],
    publishedAt: "2026-11-04",
    author: redaccion,
    visual: "cloud-layers",
    blocks: [
      {
        type: "p",
        text: "Cuando guardamos fotos \"en la nube\" o una empresa \"migra a la nube\", la palabra sugiere algo inmaterial. La realidad es más terrenal: los archivos terminan en discos ubicados en edificios llenos de servidores, con refrigeración, energía de respaldo y personal de seguridad. Lo novedoso no es la tecnología física, sino el **modelo**: usar infraestructura de otros, a pedido y pagando por lo que se consume.",
      },
      { type: "h2", id: "definicion", text: "Una definición que se volvió referencia" },
      {
        type: "p",
        text: "En 2011, el Instituto Nacional de Estándares y Tecnología de Estados Unidos (NIST) publicó una definición breve que sigue siendo la más citada. Según ella, un servicio es de nube cuando reúne cinco características:",
      },
      {
        type: "ol",
        items: [
          "**Autoservicio a pedido:** puedes obtener capacidad sin negociar con una persona.",
          "**Acceso amplio por red:** se usa desde distintos dispositivos a través de internet.",
          "**Recursos compartidos:** la misma infraestructura atiende a muchos clientes de forma aislada.",
          "**Elasticidad rápida:** la capacidad crece o se reduce según la demanda.",
          "**Servicio medido:** el uso se mide, y normalmente se paga en función de él.",
        ],
      },
      { type: "h2", id: "capas", text: "Tres formas de usar la nube" },
      {
        type: "p",
        text: "La misma definición distingue tres modelos de servicio, que se entienden mejor como capas: cuanto más arriba, menos cosas administras tú.",
      },
      {
        type: "figure",
        visual: "cloud-layers",
        caption: "IaaS, PaaS y SaaS: a medida que se sube de capa, el proveedor administra más componentes y la organización se concentra en sus datos y su uso.",
      },
      {
        type: "ul",
        items: [
          "**Infraestructura como servicio (IaaS):** arriendas máquinas virtuales, almacenamiento y redes. Tú instalas y mantienes el resto.",
          "**Plataforma como servicio (PaaS):** el proveedor gestiona sistemas operativos y bases de datos; tú despliegas tus aplicaciones.",
          "**Software como servicio (SaaS):** usas una aplicación terminada, como el correo web o una suite de oficina.",
        ],
      },
      { type: "h2", id: "preguntas", text: "Preguntas que conviene hacerse" },
      {
        type: "p",
        text: "La nube trae ventajas reales —no comprar equipos, escalar rápido, acceder desde cualquier lugar— pero también traslada responsabilidades. Antes de confiar información importante a un servicio, vale la pena preguntar:",
      },
      {
        type: "ul",
        items: [
          "¿En qué país se almacenan los datos y qué leyes los rigen?",
          "¿Quién tiene acceso a ellos y cómo se protege ese acceso?",
          "¿Hay respaldos? ¿Qué pasa si borro algo por error?",
          "¿Puedo exportar mi información en un formato abierto si decido irme?",
          "¿Cómo crecerá el costo si mi uso se multiplica?",
        ],
      },
      {
        type: "quote",
        text: "La nube no elimina la necesidad de administrar la tecnología: cambia qué parte administras tú y qué parte delegas.",
      },
    ],
    sources: [
      {
        title: "SP 800-145: The NIST Definition of Cloud Computing",
        publisher: "National Institute of Standards and Technology",
        url: "https://csrc.nist.gov/pubs/sp/800/145/final",
        year: "2011",
      },
    ],
  },
  {
    slug: "como-funciona-un-modelo-de-lenguaje",
    title: "Cómo funciona un modelo de lenguaje, sin magia",
    excerpt:
      "Los asistentes de inteligencia artificial redactan, resumen y conversan. Entender que su base es predecir la siguiente palabra explica tanto sus capacidades como sus errores.",
    pillar: "ia-y-nuevas-tecnologias",
    tags: ["inteligencia artificial", "modelos de lenguaje", "pensamiento crítico"],
    publishedAt: "2026-10-21",
    author: redaccion,
    visual: "token-prediction",
    featured: true,
    blocks: [
      {
        type: "p",
        text: "Pocas tecnologías han pasado tan rápido del laboratorio a la vida cotidiana como los modelos de lenguaje. Están en buscadores, en correos y en herramientas de trabajo. Para usarlos bien no se necesita saber programarlos, pero sí entender la idea central que los mueve.",
      },
      { type: "h2", id: "prediccion", text: "La idea central: predecir lo que sigue" },
      {
        type: "p",
        text: "Un modelo de lenguaje recibe un texto y calcula qué fragmento es más probable que venga a continuación. Ese fragmento se llama **token**: puede ser una palabra, parte de una palabra o un signo. El modelo elige uno, lo agrega al texto y repite el proceso. Así, token a token, se construye una respuesta completa.",
      },
      {
        type: "figure",
        visual: "token-prediction",
        caption: "En cada paso el modelo asigna probabilidades a posibles continuaciones y elige una. La respuesta completa es el resultado de repetir ese paso muchas veces.",
      },
      { type: "h2", id: "entrenamiento", text: "¿De dónde sale ese conocimiento?" },
      {
        type: "p",
        text: "Durante el **entrenamiento**, el modelo procesa enormes volúmenes de texto y ajusta millones o miles de millones de parámetros internos para predecir cada vez mejor. La arquitectura que hizo posible este salto se llama **Transformer**, presentada en 2017, cuya pieza clave —el mecanismo de *atención*— permite relacionar cada palabra con las demás del contexto.",
      },
      {
        type: "p",
        text: "Después, la mayoría de los asistentes pasa por etapas adicionales en que personas evalúan respuestas y el modelo se ajusta para ser más útil, seguir instrucciones y evitar contenidos dañinos.",
      },
      { type: "h2", id: "errores", text: "Por qué a veces se equivoca con total seguridad" },
      {
        type: "p",
        text: "Aquí está lo importante: el modelo aprende a producir texto **plausible**, no a verificar hechos. Si un dato no estaba bien representado en lo que aprendió, puede generar una respuesta convincente pero falsa: una cita que nadie dijo, una ley que no existe, una cifra inventada. A esto se le suele llamar \"alucinación\".",
      },
      {
        type: "callout",
        title: "Una regla práctica",
        text: "Usa estos asistentes para redactar, ordenar ideas, resumir textos que tú entregas o explorar un tema. Para datos, cifras, citas o decisiones importantes, **verifica en una fuente primaria**.",
      },
      { type: "h2", id: "buen-uso", text: "Buenos usos y señales de alerta" },
      {
        type: "ul",
        items: [
          "**Funciona bien** para reformular, resumir, generar borradores y explicar conceptos con distintos niveles de detalle.",
          "**Requiere cuidado** cuando pides datos precisos, recientes o muy especializados.",
          "**Evita** compartir información personal o confidencial en herramientas cuyo tratamiento de datos no conoces.",
          "**Desconfía** de respuestas sin fuentes cuando el tema importa: pide referencias y revísalas.",
        ],
      },
      {
        type: "p",
        text: "Comprender cómo funciona esta tecnología no le quita valor: permite aprovecharla mejor y reconocer sus límites. Ese es, en el fondo, el tipo de alfabetización digital que necesitamos.",
      },
    ],
    sources: [
      { title: "Attention Is All You Need", publisher: "Vaswani et al., arXiv", url: "https://arxiv.org/abs/1706.03762", year: "2017" },
      { title: "AI Risk Management Framework", publisher: "National Institute of Standards and Technology", url: "https://www.nist.gov/itl/ai-risk-management-framework" },
    ],
  },
  {
    slug: "contrasenas-gestores-y-verificacion-en-dos-pasos",
    title: "Contraseñas, gestores y verificación en dos pasos: lo esencial",
    excerpt:
      "La mayoría de los accesos indebidos no requiere hackers sofisticados: basta una contraseña reutilizada. Tres hábitos que reducen ese riesgo de forma drástica.",
    pillar: "seguridad-y-ciudadania-digital",
    tags: ["seguridad", "contraseñas", "passkeys"],
    publishedAt: "2026-10-07",
    author: redaccion,
    visual: "auth-factors",
    blocks: [
      {
        type: "p",
        text: "Cada vez que un servicio sufre una filtración, millones de combinaciones de correo y contraseña quedan expuestas. Quienes las obtienen prueban esas mismas combinaciones en otros sitios de forma automatizada. Si usas la misma contraseña en varios lugares, una filtración en un foro olvidado puede abrir la puerta a tu correo o tu banco.",
      },
      { type: "h2", id: "longitud", text: "1. Largas y únicas, mejor que \"complejas\"" },
      {
        type: "p",
        text: "Las guías del NIST, una de las referencias internacionales en identidad digital, recomiendan privilegiar la **longitud** por sobre reglas de complejidad arbitrarias, y no obligar a cambiar contraseñas periódicamente si no hay indicios de que fueron comprometidas. Una frase larga que solo tú conoces es más resistente y más fácil de recordar que \"P@ssw0rd1\".",
      },
      { type: "h2", id: "gestores", text: "2. Un gestor de contraseñas" },
      {
        type: "p",
        text: "Nadie puede recordar decenas de contraseñas largas y distintas. Un **gestor de contraseñas** las genera y las guarda cifradas; tú solo recuerdas una clave maestra. Además, los buenos gestores solo completan la contraseña en el dominio correcto, lo que ayuda a detectar sitios falsos.",
      },
      { type: "h2", id: "segundo-factor", text: "3. Un segundo factor" },
      {
        type: "p",
        text: "La verificación en dos pasos agrega una prueba adicional: algo que *tienes* (tu teléfono, una llave física) además de algo que *sabes* (la contraseña). Así, aunque alguien obtenga tu contraseña, no podrá entrar.",
      },
      {
        type: "figure",
        visual: "auth-factors",
        caption: "No todos los segundos factores protegen igual: los códigos por SMS son mejores que nada, las aplicaciones de autenticación son mejores, y las llaves de seguridad y passkeys resisten incluso sitios falsificados.",
      },
      { type: "h2", id: "passkeys", text: "Lo que viene: passkeys" },
      {
        type: "p",
        text: "Las **passkeys** reemplazan la contraseña por un par de claves criptográficas guardadas en tu dispositivo, que desbloqueas con tu huella, tu rostro o un PIN. Como la clave está asociada al dominio legítimo, un sitio falso no puede usarla. Ya son compatibles con los principales sistemas operativos y muchos servicios populares.",
      },
      {
        type: "callout",
        title: "Por dónde empezar hoy",
        text: "Activa la verificación en dos pasos en tu correo principal: es la llave que permite recuperar casi todas tus otras cuentas. Luego haz lo mismo con tu banco y tus redes sociales.",
      },
    ],
    sources: [
      {
        title: "SP 800-63B: Digital Identity Guidelines — Authentication and Lifecycle Management",
        publisher: "National Institute of Standards and Technology",
        url: "https://pages.nist.gov/800-63-3/sp800-63b.html",
      },
      { title: "Passkeys", publisher: "FIDO Alliance", url: "https://fidoalliance.org/passkeys/" },
      { title: "Secure Our World", publisher: "Cybersecurity and Infrastructure Security Agency (CISA)", url: "https://www.cisa.gov/secure-our-world" },
    ],
  },
  {
    slug: "dato-no-es-lo-mismo-que-informacion",
    title: "Un dato no es lo mismo que información",
    excerpt:
      "\"22\" es un dato. \"22 °C en Temuco a las 14:00\" ya es información. La diferencia —el contexto— explica por qué tantas organizaciones tienen muchos datos y poco conocimiento.",
    pillar: "ciencia-y-conocimiento",
    tags: ["datos", "fundamentos", "metadatos"],
    publishedAt: "2026-09-23",
    author: redaccion,
    visual: "data-information",
    blocks: [
      {
        type: "p",
        text: "Se dice que vivimos en la era de los datos, y es cierto que nunca habíamos registrado tanto. Pero acumular datos no es lo mismo que saber más. Para entender por qué, sirve una idea clásica en las ciencias de la información: la distinción entre datos, información, conocimiento y sabiduría.",
      },
      { type: "h2", id: "jerarquia", text: "Cuatro niveles" },
      {
        type: "ol",
        items: [
          "**Dato:** un registro aislado. \"22\".",
          "**Información:** un dato con contexto que le da significado. \"22 °C en Temuco, hoy a las 14:00\".",
          "**Conocimiento:** información relacionada con otra y con experiencia. \"Es una temperatura alta para esta fecha en Temuco\".",
          "**Sabiduría:** la capacidad de usar ese conocimiento para decidir bien. \"Conviene adelantar el riego\".",
        ],
      },
      {
        type: "figure",
        visual: "data-information",
        caption: "Cada nivel agrega contexto, relación o juicio. Los datos sin contexto no responden ninguna pregunta.",
      },
      {
        type: "p",
        text: "Esta jerarquía ha sido discutida y matizada por la investigación —el paso de un nivel a otro no es mecánico—, pero sigue siendo útil para una idea práctica: **el valor no está en el dato, sino en el contexto que lo acompaña**.",
      },
      { type: "h2", id: "metadatos", text: "El contexto tiene nombre: metadatos" },
      {
        type: "p",
        text: "En una organización, ese contexto se registra como **metadatos**: qué significa cada campo, de dónde viene, cuándo se actualizó, quién es responsable, qué unidad de medida usa. Sin ellos, dos áreas pueden hablar de \"clientes activos\" y estar contando cosas distintas.",
      },
      {
        type: "callout",
        title: "Un ejemplo cotidiano",
        text: "Una planilla con una columna llamada \"monto\" no dice si incluye impuestos, en qué moneda está ni a qué periodo corresponde. Cada persona que la use tendrá que adivinarlo, y no todas adivinarán lo mismo.",
      },
      { type: "h2", id: "implicancias", text: "Por qué esto importa más allá de la teoría" },
      {
        type: "ul",
        items: [
          "Al leer una cifra en la prensa, pregunta qué mide exactamente, desde cuándo y comparada con qué.",
          "En el trabajo, documentar el significado de los datos ahorra horas de discusiones y errores.",
          "Los sistemas de inteligencia artificial también dependen de esto: aprenden de datos, y heredan sus vacíos de contexto.",
        ],
      },
    ],
    sources: [
      { title: "From Data to Wisdom", publisher: "R. L. Ackoff, Journal of Applied Systems Analysis, 16", year: "1989" },
      {
        title: "The wisdom hierarchy: representations of the DIKW hierarchy",
        publisher: "J. Rowley, Journal of Information Science, 33(2)",
        year: "2007",
      },
    ],
  },
  {
    slug: "cuanta-energia-consume-lo-digital",
    title: "¿Cuánta energía consume lo digital?",
    excerpt:
      "Los centros de datos ya consumen una fracción relevante de la electricidad mundial, y la inteligencia artificial acelera esa demanda. Qué dicen las cifras y qué preguntas abren.",
    pillar: "tecnologia-y-sociedad",
    tags: ["energía", "centros de datos", "sostenibilidad"],
    publishedAt: "2026-09-09",
    author: redaccion,
    visual: "energy-grid",
    blocks: [
      {
        type: "p",
        text: "Cada búsqueda, video o consulta a un asistente se resuelve en algún centro de datos que consume electricidad para funcionar y para enfriarse. Individualmente, ese consumo es pequeño. Sumado a escala planetaria, se vuelve un tema de política energética.",
      },
      { type: "h2", id: "cifras", text: "Lo que dicen las cifras" },
      {
        type: "p",
        text: "Según la Agencia Internacional de Energía (AIE), los centros de datos consumieron cerca de **415 TWh** de electricidad en 2024, alrededor del **1,5 %** del consumo eléctrico mundial. En su escenario base, la agencia proyecta que esa demanda podría más que duplicarse hacia 2030, impulsada en buena parte por la inteligencia artificial.",
      },
      {
        type: "figure",
        visual: "energy-grid",
        caption: "Orden de magnitud del consumo eléctrico de los centros de datos según la AIE: estimación para 2024 y proyección del escenario base para 2030.",
      },
      {
        type: "p",
        text: "El impacto no se reparte de forma pareja: los centros de datos se concentran en ciertas regiones, donde pueden presionar redes eléctricas locales y el uso de agua para refrigeración.",
      },
      { type: "h2", id: "matices", text: "Matices necesarios" },
      {
        type: "ul",
        items: [
          "**La eficiencia mejora:** cada generación de equipos hace más trabajo por unidad de energía, aunque la demanda total crezca más rápido.",
          "**La fuente importa:** no es lo mismo un kWh de una red con alta participación renovable que uno generado con carbón.",
          "**Las proyecciones son inciertas:** dependen de la adopción de IA, de la eficiencia futura y de decisiones regulatorias.",
        ],
      },
      { type: "h2", id: "preguntas", text: "Las preguntas que abre" },
      {
        type: "p",
        text: "Más que culpa individual, el tema plantea preguntas colectivas: ¿cómo se planifica la infraestructura eléctrica?, ¿qué transparencia deben ofrecer las empresas sobre su consumo?, ¿cómo se priorizan los usos de la tecnología? Estar informados es el primer paso para participar en esas decisiones.",
      },
    ],
    sources: [
      { title: "Energy and AI", publisher: "International Energy Agency (IEA)", url: "https://www.iea.org/reports/energy-and-ai", year: "2025" },
    ],
  },
];

export const glossary: GlossaryTerm[] = [
  { term: "Algoritmo", definition: "Secuencia finita de pasos para resolver un problema o realizar una tarea. Una receta de cocina es, en ese sentido, un algoritmo." },
  { term: "API", definition: "Interfaz de programación de aplicaciones: un contrato que permite que dos sistemas se comuniquen intercambiando mensajes con un formato acordado." },
  { term: "Base de datos", definition: "Sistema que almacena información de forma organizada para consultarla, actualizarla y protegerla de manera eficiente." },
  { term: "Cifrado", definition: "Transformación de información para que solo pueda leerla quien posee la clave adecuada.", related: "contrasenas-gestores-y-verificacion-en-dos-pasos" },
  { term: "Datos personales", definition: "Cualquier información que identifica o permite identificar a una persona, como su nombre, RUT, correo o ubicación." },
  { term: "DNS", definition: "Sistema de nombres de dominio: traduce nombres legibles (como un sitio web) a direcciones numéricas que usan los computadores.", related: "que-pasa-cuando-abres-una-pagina-web" },
  { term: "Gobierno de datos", definition: "Conjunto de roles, reglas y procesos que define quién decide sobre los datos de una organización, cómo se usan y cómo se protege su calidad." },
  { term: "Inteligencia artificial", definition: "Campo que desarrolla sistemas capaces de realizar tareas que asociamos con la inteligencia humana, como reconocer patrones, traducir o generar texto." },
  { term: "Metadatos", definition: "Datos que describen a otros datos: qué significan, de dónde vienen, cuándo se actualizaron y quién es responsable.", related: "dato-no-es-lo-mismo-que-informacion" },
  { term: "Modelo de lenguaje", definition: "Sistema de IA entrenado con grandes volúmenes de texto para predecir y generar lenguaje.", related: "como-funciona-un-modelo-de-lenguaje" },
  { term: "Nube", definition: "Modelo de uso de infraestructura y servicios informáticos de terceros, a pedido y a través de internet.", related: "que-significa-que-algo-este-en-la-nube" },
  { term: "Passkey", definition: "Credencial basada en criptografía que reemplaza a la contraseña y se desbloquea con biometría o PIN en tu dispositivo.", related: "contrasenas-gestores-y-verificacion-en-dos-pasos" },
  { term: "Phishing", definition: "Engaño que suplanta a una entidad confiable para obtener contraseñas, datos bancarios u otra información sensible." },
  { term: "Protocolo", definition: "Conjunto de reglas que define cómo dos sistemas intercambian información. HTTP, TCP y TLS son protocolos." },
  { term: "Servidor", definition: "Computador o programa que atiende peticiones de otros (clientes), por ejemplo entregando páginas web o archivos." },
  { term: "Token", definition: "En modelos de lenguaje, fragmento mínimo de texto que el modelo procesa: una palabra, parte de ella o un signo.", related: "como-funciona-un-modelo-de-lenguaje" },
];

export const learningResources: ExternalResource[] = [
  {
    title: "Learning Center",
    publisher: "Cloudflare",
    url: "https://www.cloudflare.com/learning/",
    description: "Explicaciones claras sobre redes, seguridad y funcionamiento de internet.",
    kind: "guía",
    topic: "Internet",
  },
  {
    title: "Secure Our World",
    publisher: "CISA",
    url: "https://www.cisa.gov/secure-our-world",
    description: "Recomendaciones básicas de ciberseguridad para personas y pequeñas organizaciones.",
    kind: "guía",
    topic: "Seguridad",
  },
  {
    title: "AI Risk Management Framework",
    publisher: "NIST",
    url: "https://www.nist.gov/itl/ai-risk-management-framework",
    description: "Marco de referencia para identificar y gestionar riesgos en sistemas de inteligencia artificial.",
    kind: "marco de referencia",
    topic: "Inteligencia artificial",
  },
  {
    title: "Portal de datos abiertos del Estado de Chile",
    publisher: "Gobierno de Chile",
    url: "https://datos.gob.cl/",
    description: "Conjuntos de datos públicos para explorar, aprender y practicar análisis.",
    kind: "datos abiertos",
    topic: "Datos",
  },
];
