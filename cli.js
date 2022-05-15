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
		`> **Found \`${data.totals.errors} errors, ${data.totals.warnings} warnings\` - Generated on ${new Date(Date.now()).toUTCString()}.**\n`
	);

	stream.write( '---\n');

	for (const file in data.files) {
		const result = data.files[file];
		if (result.errors == 0 && result.warnings == 0) {
			continue;
		}
		stream.write(
			`#### :clipboard: \`${file}\` - :small_red_triangle: ${result.errors} errors & :small_orange_diamond: ${result.warnings} warnings\n`
		);
		stream.write(`| # | Type | Message | Severity |\n`);
		stream.write(`| --- | --- | --- | --- |\n`);

		result.messages.map((message) => {
			stream.write(
				`| ${message.line} | ${message.type} | ${message.message} (\`${message.source}\`) | ${message.severity} |\n`
			);
		});
	}
}

run();
