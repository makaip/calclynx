export const commands = [
  {
    label: 'Simplify',
    category: 'algebra',
    description: 'Simplify the mathematical expression',
    mgCalcMethod: 'Simplify'
  },
  {
    label: 'Expand',
    category: 'algebra',
    description: 'Expand the mathematical expression',
    mgCalcMethod: 'Expand'
  },
  {
    label: 'Factor',
    category: 'algebra',
    description: 'Factor the mathematical expression',
    mgCalcMethod: 'Factor'
  },
  {
    label: 'Solve for',
    category: 'algebra',
    description: 'Solve equation for a specified variable',
    requiresVariable: true,
    variablePattern: 'solve for',
    mgCalcMethod: 'Solve'
  },
  {
    label: 'Derivative with respect to',
    category: 'calculus',
    description: 'Find the derivative with respect to a variable',
    requiresVariable: true,
    variablePattern: 'derivative with respect to',
    mgCalcMethod: 'Derivative'
  },
  {
    label: 'Integrate with respect to',
    category: 'calculus',
    description: 'Find the indefinite integral with respect to a variable',
    requiresVariable: true,
    variablePattern: 'integrate with respect to',
    mgCalcMethod: 'Integral'
  }
];

export const variablePatterns = {
  'solve for': {
    prefix: 'Solve for ',
    placeholder: 'variable',
    validator: (variable) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(variable),
    extractor: (input) => input.substring('solve for '.length).trim()
  },
  'derivative with respect to': {
    prefix: 'Derivative with respect to ',
    placeholder: 'variable',
    validator: (variable) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(variable),
    extractor: (input) => input.substring('derivative with respect to '.length).trim()
  },
  'integrate with respect to': {
    prefix: 'Integrate with respect to ',
    placeholder: 'variable',
    validator: (variable) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(variable),
    extractor: (input) => input.substring('integrate with respect to '.length).trim()
  }
};
