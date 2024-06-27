import * as esbuild from "esbuild";

await esbuild.build({
	bundle: true,
	entryPoints: ["src/index.ts"],
	outfile: "dist/index.cjs",
	format: "cjs",
	platform: "node",
});
