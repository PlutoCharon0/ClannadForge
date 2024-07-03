export default function getData(promptsResults) {
	return {
		"index.html": {
			needTypescript: promptsResults.needTypescript,
		},
		"src\\main.jsx": {
			needTypescript: promptsResults.needTypescript,
		},
		"vite.config.js": {
			plugins: [
				{
					id: "react",
					importer: "import react from '@vitejs/plugin-react'",
					initializer: "react()",
				},
			],
		},
	};
}
