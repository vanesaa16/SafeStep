import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: [
      'dist/**/*',
      'dist-standalone/**/*',
      'node_modules/**/*',
      'src/**/*',
      'server.ts',
      'vite.config.ts',
      'vite.standalone.config.ts',
    ],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
