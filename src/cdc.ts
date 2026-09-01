/**
 * CDC de SIFEN — Código de Control del documento electrónico paraguayo.
 *
 * El CDC son 44 dígitos que identifican unívocamente a cada documento
 * electrónico. Lo compone el **emisor**, no el fisco: por eso es posible
 * facturar sin conexión y transmitir después.
 *
 * Layout y códigos según el Manual Técnico del SIFEN v150 (DNIT), §10.1.
 */

/** Tipo de documento electrónico — campo `C002` / `iTiDE` del Manual Técnico. */
export const TipoDocumento = {
  FACTURA: 1,
  FACTURA_EXPORTACION: 2,
  FACTURA_IMPORTACION: 3,
  AUTOFACTURA: 4,
  NOTA_CREDITO: 5,
  NOTA_DEBITO: 6,
  NOTA_REMISION: 7,
  COMPROBANTE_RETENCION: 8,
} as const;
export type TipoDocumento = (typeof TipoDocumento)[keyof typeof TipoDocumento];

/**
 * Tipo de emisión — campo `B002` / `iTipEmi`.
 *
 * `CONTINGENCIA` existe en el estándar pero **SIFEN lo rechaza hoy**: el
 * capítulo 14 del Manual Técnico v150 figura como "(Futuro)". Para emitir sin
 * conexión se usa `NORMAL` y se transmite al reconectar.
 */
export const TipoEmision = { NORMAL: 1, CONTINGENCIA: 2 } as const;
export type TipoEmision = (typeof TipoEmision)[keyof typeof TipoEmision];

/** Tipo de contribuyente — campo `D103` / `iTipCont`. */
export const TipoContribuyente = { PERSONA_FISICA: 1, PERSONA_JURIDICA: 2 } as const;
export type TipoContribuyente = (typeof TipoContribuyente)[keyof typeof TipoContribuyente];

/** Campos que componen el CDC, en el orden en que aparecen. */
export interface CamposCdc {
  /** `C002` iTiDE — tipo de documento electrónico. */
  tipoDocumento: number;
  /** `D101` dRucEm — RUC del emisor, sin dígito verificador. */
  rucEmisor: number;
  /** `D102` dDVEmi — dígito verificador del RUC del emisor. */
  dvRucEmisor: number;
  /** `C005` dEst — establecimiento. */
  establecimiento: number;
  /** `C006` dPunExp — punto de expedición. */
  puntoExpedicion: number;
  /** `C007` dNumDoc — número correlativo del documento. */
  numeroDocumento: number;
  /** `D103` iTipCont — tipo de contribuyente. */
  tipoContribuyente: number;
  /** `D002` dFeEmiDE — fecha de emisión en formato `AAAAMMDD`. */
  fechaEmision: string;
  /** `B002` iTipEmi — tipo de emisión. */
  tipoEmision: number;
  /** `B004` dCodSeg — código de seguridad aleatorio de 9 dígitos. */
  codigoSeguridad: number;
}

/** Resultado de descomponer un CDC existente. */
export interface CdcAnalizado extends CamposCdc {
  /** `true` si el dígito verificador del CDC coincide con el calculado. */
  valido: boolean;
  /** `A003` dDVId — dígito verificador que traía el CDC. */
  digitoVerificadorRecibido: number;
  /** Dígito verificador que corresponde a los 43 dígitos anteriores. */
  digitoVerificadorEsperado: number;
  /** El CDC normalizado, 44 dígitos sin separadores. */
  cdc: string;
}

/** Se lanza cuando un campo o un CDC no cumple con el Manual Técnico. */
export class CdcInvalidoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "CdcInvalidoError";
  }
}

/** Anchos de cada campo, en el orden del CDC. Suman 43 + 1 de verificador. */
const LAYOUT = [
  ["tipoDocumento", 2],
  ["rucEmisor", 8],
  ["dvRucEmisor", 1],
  ["establecimiento", 3],
  ["puntoExpedicion", 3],
  ["numeroDocumento", 7],
  ["tipoContribuyente", 1],
  ["fechaEmision", 8],
  ["tipoEmision", 1],
  ["codigoSeguridad", 9],
] as const satisfies ReadonlyArray<readonly [keyof CamposCdc, number]>;

/** Largo total del CDC, incluido el dígito verificador. */
export const LARGO_CDC = 44;

/**
 * Dígito verificador módulo 11, tal como lo define el Manual Técnico §10.2.
 *
 * Los pesos van de 2 a `baseMax` recorriendo la cadena de derecha a izquierda,
 * y vuelven a 2 al pasarse. Un resto de 10 u 11 da dígito 0.
 *
 * @throws {CdcInvalidoError} si la cadena no es puramente numérica.
 */
export function digitoVerificador(cadena: string, baseMax = 11): number {
  if (!/^\d+$/.test(cadena)) {
    throw new CdcInvalidoError("El dígito verificador solo acepta dígitos");
  }
  let peso = 2;
  let suma = 0;
  for (let i = cadena.length - 1; i >= 0; i--) {
    if (peso > baseMax) peso = 2;
    suma += Number(cadena[i]) * peso;
    peso++;
  }
  const resto = 11 - (suma % 11);
  return resto > 9 ? 0 : resto;
}

/**
 * Compone el CDC de 44 dígitos. Es **determinista y pura**: el código de
 * seguridad entra como dato, no se genera acá.
 *
 * @throws {CdcInvalidoError} si algún campo viola el Manual Técnico, o si
 *   `dvRucEmisor` no corresponde al RUC de `rucEmisor`.
 *
 * @example
 * componerCdc({
 *   tipoDocumento: TipoDocumento.FACTURA, rucEmisor: 44444401, dvRucEmisor: 7,
 *   establecimiento: 1, puntoExpedicion: 1, numeroDocumento: 14528,
 *   tipoContribuyente: TipoContribuyente.PERSONA_JURIDICA,
 *   fechaEmision: "20170125", tipoEmision: TipoEmision.NORMAL,
 *   codigoSeguridad: 587326098,
 * }); // "01444444017001001001452822017012515873260988"
 */
export function componerCdc(campos: CamposCdc): string {
  let cuerpo = "";
  for (const [nombre, ancho] of LAYOUT) {
    if (nombre === "fechaEmision") {
      cuerpo += validarFecha(campos.fechaEmision);
      continue;
    }
    const valor = campos[nombre];
    const maximo = 10 ** ancho - 1;
    if (!Number.isInteger(valor) || valor < 0 || valor > maximo) {
      throw new CdcInvalidoError(
        `${nombre} debe ser un entero entre 0 y ${maximo}, se recibió ${valor}`,
      );
    }
    cuerpo += String(valor).padStart(ancho, "0");
  }

  // El DV del emisor tiene que corresponder a su RUC. Sin este control se puede
  // componer un CDC estructuralmente perfecto —el dígito 44 cierra igual— con un
  // RUC inconsistente adentro: el error recién aparece cuando SIFEN lo rechaza,
  // con el documento ya firmado.
  //
  // El RUC usa el mismo módulo 11 que el CDC, y el relleno con ceros a la
  // izquierda no altera el resultado porque los pesos se anclan a la derecha.
  const dvEsperado = digitoVerificador(String(campos.rucEmisor).padStart(8, "0"));
  if (campos.dvRucEmisor !== dvEsperado) {
    throw new CdcInvalidoError(
      `dvRucEmisor no corresponde al RUC ${campos.rucEmisor}: ` +
        `esperado ${dvEsperado}, se recibió ${campos.dvRucEmisor}`,
    );
  }

  // Manual Técnico §10.3: el código de seguridad es positivo y distinto del
  // número de documento.
  if (campos.codigoSeguridad < 1) {
    throw new CdcInvalidoError("codigoSeguridad debe estar entre 1 y 999999999");
  }
  if (campos.codigoSeguridad === campos.numeroDocumento) {
    throw new CdcInvalidoError(
      "codigoSeguridad no puede ser igual a numeroDocumento (Manual Técnico §10.3)",
    );
  }

  return cuerpo + String(digitoVerificador(cuerpo));
}

/**
 * Descompone un CDC en sus campos y verifica su dígito. Tolera los espacios
 * de la representación gráfica del KuDE.
 *
 * @throws {CdcInvalidoError} si no tiene 44 dígitos.
 */
export function analizarCdc(cdc: string): CdcAnalizado {
  const limpio = String(cdc).replace(/[\s.-]/g, "");
  if (!/^\d{44}$/.test(limpio)) {
    throw new CdcInvalidoError(
      `El CDC debe tener exactamente 44 dígitos, se recibieron ${limpio.length}`,
    );
  }

  const campos: Record<string, string> = {};
  let pos = 0;
  for (const [nombre, ancho] of LAYOUT) {
    campos[nombre] = limpio.slice(pos, pos + ancho);
    pos += ancho;
  }

  const esperado = digitoVerificador(limpio.slice(0, 43));
  const recibido = Number(limpio[43]);

  return {
    tipoDocumento: Number(campos.tipoDocumento),
    rucEmisor: Number(campos.rucEmisor),
    dvRucEmisor: Number(campos.dvRucEmisor),
    establecimiento: Number(campos.establecimiento),
    puntoExpedicion: Number(campos.puntoExpedicion),
    numeroDocumento: Number(campos.numeroDocumento),
    tipoContribuyente: Number(campos.tipoContribuyente),
    fechaEmision: campos.fechaEmision,
    tipoEmision: Number(campos.tipoEmision),
    codigoSeguridad: Number(campos.codigoSeguridad),
    valido: esperado === recibido,
    digitoVerificadorRecibido: recibido,
    digitoVerificadorEsperado: esperado,
    cdc: limpio,
  };
}

/** Indica si un CDC es válido. Nunca lanza: ante basura devuelve `false`. */
export function validarCdc(cdc: string): boolean {
  try {
    return analizarCdc(cdc).valido;
  } catch {
    return false;
  }
}

/**
 * Formatea el CDC en grupos de cuatro, como exige el Manual Técnico §10.1
 * para la representación gráfica (KuDE).
 *
 * @example
 * formatearKude("01444444017001001001452822017012515873260988");
 * // "0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988"
 */
export function formatearKude(cdc: string): string {
  const { cdc: limpio } = analizarCdc(cdc);
  return (limpio.match(/.{1,4}/g) ?? []).join(" ");
}

/**
 * Genera un código de seguridad conforme al Manual Técnico §10.3: aleatorio,
 * entre 1 y 999999999, y distinto del número de documento.
 *
 * Usa `crypto.getRandomValues`, disponible en Node 19+ y en el navegador.
 * El muestreo por rechazo evita el sesgo del módulo.
 *
 * @param numeroDocumento Si se pasa, el resultado nunca será igual a este valor.
 */
export function generarCodigoSeguridad(numeroDocumento?: number): number {
  const MAXIMO = 999_999_999;
  // Mayor múltiplo de MAXIMO que entra en 32 bits: descartamos por encima.
  const LIMITE = Math.floor(0x1_0000_0000 / MAXIMO) * MAXIMO;
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    if (buffer[0] >= LIMITE) continue;
    const valor = (buffer[0] % MAXIMO) + 1;
    if (valor !== numeroDocumento) return valor;
  }
}

/** Valida que la fecha sea `AAAAMMDD` y exista en el calendario. */
function validarFecha(fecha: string): string {
  if (!/^\d{8}$/.test(fecha)) {
    throw new CdcInvalidoError(`fechaEmision debe ser AAAAMMDD, se recibió "${fecha}"`);
  }
  const anio = Number(fecha.slice(0, 4));
  const mes = Number(fecha.slice(4, 6));
  const dia = Number(fecha.slice(6, 8));
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    d.getUTCFullYear() !== anio ||
    d.getUTCMonth() !== mes - 1 ||
    d.getUTCDate() !== dia
  ) {
    throw new CdcInvalidoError(`fechaEmision no existe en el calendario: "${fecha}"`);
  }
  return fecha;
}
