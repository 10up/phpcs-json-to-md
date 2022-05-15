#!/usr/bin/env node
import meow from "meow";
import fs from "fs";

async function run() {
	const cli = meow(
		`
	Usage
	  $ ./phpcs-json-to-md

	Options:
`,
		{
			importMeta: import.meta,
			flags: {
				path: {
					type: "string",
					isRequired: true,
				},
				output: {
					type: "string",
					isRequired: true,
				},
			},
		}
	);

	const getDisplayPath = (filePath, label = "", line = 0) => {
		filePath = filePath.replace("/github/workspace/", "");

		if (!label) {
			label = filePath;
		}

		if (!process.env.GITHUB_SHA || !process.env.GITHUB_REPOSITORY) {
			return label;
		}

		let url = `https://github.com/${process.env.GITHUB_REPOSITORY}/blob/${process.env.GITHUB_SHA}/${filePath}`;

		if (line) {
			url += `#L${line}`;
		}

		return `[${label}](${url})`;
	};

	let data;
	try {
		const json = fs.readFileSync(cli.flags.path, "utf-8");
		data = JSON.parse(json);
	} catch (err) {
		console.log("Error: Can not read the JSON file.");
		console.log(err);
		process.exit(1);
	}

	const stream = fs.createWriteStream(cli.flags.output);

	stream.write(
		`> **Found \`${data.totals.errors} errors, ${
			data.totals.warnings
		} warnings\` - Generated on ${new Date(Date.now()).toUTCString()}.**\n`
	);

	stream.write("---\n");

	for (const file in data.files) {
		const result = data.files[file];
		if (result.errors == 0 && result.warnings == 0) {
			continue;
		}
		stream.write(
			`#### :clipboard: ${getDisplayPath(file)} - :small_red_triangle: ${
				result.errors
			} errors & :small_orange_diamond: ${result.warnings} warnings\n`
		);
		stream.write(`| # | Type | Message | Severity |\n`);
		stream.write(`| --- | --- | --- | --- |\n`);

		result.messages.map((message) => {
			stream.write(
				`| ${getDisplayPath(file, message.line, message.line)} | ${message.type} | ${message.message} (\`${message.source}\`) | ${message.severity} |\n`
			);
		});
	}
}

run();
