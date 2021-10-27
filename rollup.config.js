import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

const outputDirectory = 'dist';

const inputConfig = {
  input: './src/index.ts',
  plugins: [
    typescript({
      declaration: false,
    }),
  ],
};

const outputConfig = {
  name: 'NewProxy',
};

export default [
  {
    ...inputConfig,
    output: [
      // CommonJS
      {
        ...outputConfig,
        file: `${outputDirectory}/newproxy.js`,
        format: 'cjs',
      },
    ],
  },

  // TypeScript defs
  {
    ...inputConfig,
    plugins: [dts()],
    output: {
      file: `${outputDirectory}/newproxy.d.ts`,
      format: 'es',
    },
  },
];
