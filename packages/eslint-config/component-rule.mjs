export default {
  meta: {
    type: 'problem',
    schema: [],
    messages: { multiple: 'Exportá un solo componente por archivo.' },
  },
  create(context) {
    let count = 0;
    return {
      ExportNamedDeclaration(node) {
        const declaration = node.declaration;
        const names = declaration?.type === 'FunctionDeclaration'
          ? [declaration.id?.name]
          : declaration?.type === 'VariableDeclaration'
            ? declaration.declarations.map((item) => item.id.type === 'Identifier' ? item.id.name : undefined)
            : node.exportKind === 'type' ? [] : node.specifiers.map((item) => item.exported.name);
        count += names.filter((name) => name && /^[A-Z]/.test(name)).length;
        if (count > 1) context.report({ node, messageId: 'multiple' });
      },
      ExportDefaultDeclaration(node) {
        count += 1;
        if (count > 1) context.report({ node, messageId: 'multiple' });
      },
    };
  },
};
