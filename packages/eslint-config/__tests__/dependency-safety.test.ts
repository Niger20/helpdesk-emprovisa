import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

interface Ast { type: string; nodes?: Ast[]; parent?: Ast; value?: string; commas?: number; ranges?: number }
interface Braces {
  parse: (input: string) => Ast;
  compile: (input: string | Ast) => string;
  expand: (input: string | Ast) => string[];
  stringify: (input: Ast) => string;
}
const lintRequire = createRequire(new URL('../package.json', import.meta.url));
const apiRequire = createRequire(new URL('../../../apps/api/package.json', import.meta.url));
const boundariesRequire = createRequire(lintRequire.resolve('eslint-plugin-boundaries'));
const codegenRequire = createRequire(apiRequire.resolve('kysely-codegen'));
const consumers = [['lint', boundariesRequire], ['codegen', codegenRequire]] as const;
const limitMessage = 'Pattern nesting exceeds the local limit (64 AST levels)';

function nestedAst() {
  const root: Ast = { type: 'root', nodes: [] };
  let parent = root;
  for (let level = 0; level < 256; level++) {
    const child: Ast = { type: 'brace', nodes: [], parent, commas: 1, ranges: 0 };
    parent.nodes?.push(child);
    parent = child;
  }
  parent.nodes?.push({ type: 'text', value: 'x' });
  return root;
}

describe.each(consumers)('mitigación Braces en %s', (_label, consumerRequire) => {
  const micromatchRequire = createRequire(consumerRequire.resolve('micromatch'));
  const braces = micromatchRequire('braces') as Braces;

  it.each(['{', '('])('rechaza 4.000 niveles de %s dentro del límite de longitud', (opening) => {
    const closing = opening === '{' ? '}' : ')';
    const pattern = opening.repeat(4000) + 'x' + closing.repeat(4000);
    for (const operation of [braces.parse, braces.compile, braces.expand]) {
      expect(() => operation(pattern)).toThrow(limitMessage);
    }
  });

  it('protege también recorridos de un AST profundo recibido directamente', () => {
    for (const operation of [braces.compile, braces.expand, braces.stringify]) {
      expect(() => operation(nestedAst())).toThrow(limitMessage);
    }
  });

  it('conserva globos normales, rangos, alternativas y llaves escapadas', () => {
    expect(braces.compile('src/{a,b}.ts')).toBe('src/(a|b).ts');
    expect(braces.expand('src/{a,b}.ts')).toEqual(['src/a.ts', 'src/b.ts']);
    expect(braces.expand('{1..3}')).toEqual(['1', '2', '3']);
    expect(braces.stringify(braces.parse('src/\\{a,b\\}.ts'))).toBe('src/{a,b}.ts');
  });
});

describe('dependencias corregidas compatibles con sus consumidores', () => {
  it('Handlebars corregido conserva las plantillas del linter', () => {
    const handlebars = boundariesRequire('handlebars') as { VERSION: string; compile: (template: string) => (input: { modulo: string }) => string };
    expect(handlebars.VERSION).toBe('4.7.10');
    expect(handlebars.compile('{{modulo}}')({ modulo: 'tickets' })).toBe('tickets');
  });

  it('UUID corregido conserva require y v4 utilizados por ExcelJS', () => {
    const excelRequire = createRequire(apiRequire.resolve('exceljs'));
    const uuid = excelRequire('uuid') as { v4: () => string };
    expect(uuid.v4()).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    expect((excelRequire('uuid/package.json') as { version: string }).version).toBe('11.1.1');
  });
});
