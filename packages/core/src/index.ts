#!/usr/bin/env node
import { createCommand } from "commander";

import { create } from "./utils/create";

import { version } from "../package.json";

const program = createCommand();

program
	.version(version, "-v, --vers", "Output the current version")
	.arguments("[project-name]")
	.description("Create a directory for your project files")
	.option("-f, --force", "Overwrite target directory if it exists")
	.option("-t, --template <template>", "Enter the template you used to create")
	.option("-m, --mode <mode>", "Inter interaction mode you prefer")
	// .option("--dev", "Use development mode")
	.action((name: string, options: Record<string, any>) => {
		create(name, options);
	});

program.parse(process.argv);
