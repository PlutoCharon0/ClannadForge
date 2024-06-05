import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import del from "rollup-plugin-delete";
// rollup.config.mjs
// ---cut-start---
/** @type {import('rollup').RollupOptions} */
// ---cut-end---
export default {
	input: "src/index.ts",
	output: [
		{
			entryFileNames: "[name].esm.js",
			format: "esm",
			dir: "dist",
		},
		{
			entryFileNames: "[name].cjs.js",
			dir: "dist",
			format: "cjs",
		},
	],
	plugins: [
		typescript({ tsconfig: "./tsconfig.json" }),
		terser(),
		del({ targets: "dist/*" }),
		nodeResolve({
			preferBuiltins: true,
		}),
	],
};
