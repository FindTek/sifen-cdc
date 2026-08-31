import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  componerCdc, analizarCdc, validarCdc, formatearKude,
  digitoVerificador, generarCodigoSeguridad,
  TipoDocumento, TipoEmision, TipoContribuyente,
  CdcInvalidoError, LARGO_CDC,
  type CamposCdc,
} from "../src/cdc.ts";

/**
 * Caso oficial: el ejemplo del Manual Técnico v150 §10.1, con su
 * representación gráfica tal como figura en la página 57 del PDF.
 */
const CDC_MANUAL = "01444444017001001001452822017012515873260988";
const KUDE_MANUAL = "0144 4444 0170 0100 1001 4528 2201 7012 5158 7326 0988";
const CAMPOS_MANUAL: CamposCdc = {
  tipoDocumento: TipoDocumento.FACTURA,
  rucEmisor: 44444401,
  dvRucEmisor: 7,
  establecimiento: 1,
  puntoExpedicion: 1,
  numeroDocumento: 14528,
  tipoContribuyente: TipoContribuyente.PERSONA_JURIDICA,
  fechaEmision: "20170125",
  tipoEmision: TipoEmision.NORMAL,
  codigoSeguridad: 587326098,
};

describe("caso oficial del Manual Técnico v150", () => {
  test("compone el CDC exacto del manual", () => {
    assert.equal(componerCdc(CAMPOS_MANUAL), CDC_MANUAL);
  });

  test("el CDC del manual tiene 44 dígitos", () => {
    assert.equal(CDC_MANUAL.length, LARGO_CDC);
  });

  test("valida el dígito verificador del manual", () => {
    assert.equal(validarCdc(CDC_MANUAL), true);
  });

  test("reproduce la representación gráfica del KuDE", () => {
    assert.equal(formatearKude(CDC_MANUAL), KUDE_MANUAL);
  });

  test("componer y analizar son inversos", () => {
    const a = analizarCdc(CDC_MANUAL);
    for (const [clave, valor] of Object.entries(CAMPOS_MANUAL)) {
      assert.equal(a[clave as keyof CamposCdc], valor, `campo ${clave}`);
    }
  });
});

describe("digitoVerificador", () => {
  test("coincide con el del CDC oficial", () => {
    assert.equal(digitoVerificador(CDC_MANUAL.slice(0, 43)), 8);
  });

  test("rechaza cadenas no numéricas", () => {
    assert.throws(() => digitoVerificador("12a4"), CdcInvalidoError);
  });
});

describe("componerCdc — validaciones del manual", () => {
  test("rechaza un campo fuera de rango", () => {
    assert.throws(
      () => componerCdc({ ...CAMPOS_MANUAL, establecimiento: 1000 }),
      CdcInvalidoError,
    );
    assert.throws(
      () => componerCdc({ ...CAMPOS_MANUAL, numeroDocumento: 10_000_000 }),
      CdcInvalidoError,
    );
  });

  test("rechaza una fecha inexistente", () => {
    assert.throws(() => componerCdc({ ...CAMPOS_MANUAL, fechaEmision: "20170230" }), CdcInvalidoError);
    assert.throws(() => componerCdc({ ...CAMPOS_MANUAL, fechaEmision: "2017-01-25" }), CdcInvalidoError);
  });

  test("§10.3: el código de seguridad no puede ser el número de documento", () => {
    assert.throws(
      () => componerCdc({ ...CAMPOS_MANUAL, codigoSeguridad: CAMPOS_MANUAL.numeroDocumento }),
      CdcInvalidoError,
    );
  });

  test("§10.3: el código de seguridad debe ser positivo", () => {
    assert.throws(() => componerCdc({ ...CAMPOS_MANUAL, codigoSeguridad: 0 }), CdcInvalidoError);
  });

  test("rellena con ceros a la izquierda", () => {
    const cdc = componerCdc({ ...CAMPOS_MANUAL, establecimiento: 1, puntoExpedicion: 2 });
    assert.equal(cdc.slice(11, 14), "001");
    assert.equal(cdc.slice(14, 17), "002");
  });
});

describe("analizarCdc", () => {
  test("tolera la representación gráfica con espacios", () => {
    assert.equal(analizarCdc(KUDE_MANUAL).cdc, CDC_MANUAL);
    assert.equal(validarCdc(KUDE_MANUAL), true);
  });

  test("informa el dígito esperado cuando no coincide", () => {
    const roto = CDC_MANUAL.slice(0, 43) + "0";
    const a = analizarCdc(roto);
    assert.equal(a.valido, false);
    assert.equal(a.digitoVerificadorRecibido, 0);
    assert.equal(a.digitoVerificadorEsperado, 8);
  });

  test("lanza si no son 44 dígitos", () => {
    assert.throws(() => analizarCdc("123"), CdcInvalidoError);
    assert.throws(() => analizarCdc(CDC_MANUAL + "9"), CdcInvalidoError);
  });

  test("validarCdc devuelve false en vez de lanzar", () => {
    assert.equal(validarCdc(""), false);
    assert.equal(validarCdc("no es un cdc"), false);
  });
});

describe("alcance de la detección de errores", () => {
  /**
   * El módulo 11 con pesos cíclicos 2..11 tiene un punto ciego: donde el peso
   * es 11, el producto es múltiplo de 11 y no aporta nada al resto. En un CDC
   * de 43 dígitos eso ocurre en las posiciones 4, 14, 24 y 34.
   *
   * No es un defecto de esta librería sino del algoritmo que define el Manual
   * Técnico §10.2. Se documenta para que nadie asume una garantía que no hay.
   */
  const POSICIONES_CIEGAS = [4, 14, 24, 34];

  test("detecta el cambio de un dígito en las 39 posiciones sensibles", () => {
    const noDetectadas: number[] = [];
    for (let i = 0; i < 43; i++) {
      const original = Number(CDC_MANUAL[i]);
      const alterado =
        CDC_MANUAL.slice(0, i) + ((original + 1) % 10) + CDC_MANUAL.slice(i + 1);
      if (validarCdc(alterado)) noDetectadas.push(i + 1);
    }
    assert.deepEqual(noDetectadas, POSICIONES_CIEGAS);
  });

  test("las posiciones ciegas son exactamente las de peso 11", () => {
    for (const pos of POSICIONES_CIEGAS) {
      // Contando desde la derecha del cuerpo de 43 dígitos, el peso arranca
      // en 2 y sube de a uno: peso = ((43 - pos) % 10) + 2.
      assert.equal(((43 - pos) % 10) + 2, 11, `posición ${pos}`);
    }
  });

  test("transponer dígitos adyacentes se detecta siempre", () => {
    let detectadas = 0, probadas = 0;
    for (let i = 0; i < 42; i++) {
      if (CDC_MANUAL[i] === CDC_MANUAL[i + 1]) continue;
      probadas++;
      const alterado =
        CDC_MANUAL.slice(0, i) + CDC_MANUAL[i + 1] + CDC_MANUAL[i] + CDC_MANUAL.slice(i + 2);
      if (!validarCdc(alterado)) detectadas++;
    }
    assert.equal(detectadas, probadas, `${probadas - detectadas} transposiciones no detectadas`);
  });
});

describe("generarCodigoSeguridad", () => {
  test("siempre cae en el rango del manual", () => {
    for (let i = 0; i < 5000; i++) {
      const c = generarCodigoSeguridad();
      assert.ok(c >= 1 && c <= 999_999_999, `fuera de rango: ${c}`);
      assert.ok(Number.isInteger(c));
    }
  });

  test("nunca devuelve el número de documento", () => {
    for (let i = 0; i < 200; i++) {
      assert.notEqual(generarCodigoSeguridad(500), 500);
    }
  });

  test("no repite: 2000 valores dan al menos 1990 distintos", () => {
    const vistos = new Set<number>();
    for (let i = 0; i < 2000; i++) vistos.add(generarCodigoSeguridad());
    assert.ok(vistos.size >= 1990, `solo ${vistos.size} distintos`);
  });

  test("el resultado compone un CDC válido", () => {
    const campos = { ...CAMPOS_MANUAL, codigoSeguridad: generarCodigoSeguridad() };
    assert.equal(validarCdc(componerCdc(campos)), true);
  });
});
