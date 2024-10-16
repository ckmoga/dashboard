import { snakeCase } from 'snake-case';

const kebabCase = (value) => snakeCase(value).replace(/_/g, '-');

export default kebabCase;
