import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testTimeout: 10000000,
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;
