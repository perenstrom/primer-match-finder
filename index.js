const csv = require('csvtojson');
const fs = require('fs');
const json2csv = require('json2csv').parse;

main();

async function main() {
	if(process.argv[2] === undefined){
		console.log("Specify file name. Ex: node index.js input.csv 3");
	} 
	else if(process.argv[3] === undefined){
		console.log("Specify limit of similarity. Ex: node index.js input.csv 3");
	} else {
		const inputFilePath = process.argv[2];
		const limit = process.argv[3];
		try {
			const parsedPrimers = await parsePrimersFromCSVFile(inputFilePath);
			const primers = convertParsedJsonPrimersToArray(parsedPrimers);
			const matches = findSimilarPrimers(primers, limit);
			const matchesCsv = convertToCSV(matches);
			writeCsvToFile(matchesCsv, "./", "matches.csv");
		} catch (err){
			console.log(err);
		}
	}
}

function parsePrimersFromCSVFile(csvFilePath) {
	return new Promise((resolve, reject) => {
		let primers = [];

		csv()
			.fromFile(csvFilePath)
			.on('json', (primer) => {
				primers.push(primer);
			})
			.on('done', error => {
				resolve(primers);
			})
			.on('error', error => {
				reject(error)
			});
	})
}

function convertParsedJsonPrimersToArray(primers){
	return primers.map(primer => primer.primer);
}

function findSimilarPrimers(primers, limit){
	const numberOfPrimers = primers.length;
	let matches = [];

	for(let i = 0; i < numberOfPrimers - 1; i++){
		for(let j = i + 1; j < numberOfPrimers; j++){
			const firstPrimer = primers[i];
			const secondPrimer = primers[j];

			const shortestLength = (firstPrimer.length < secondPrimer.length) ? firstPrimer.length : secondPrimer.length;

			let similarBases = 0;
			for(let k = 0; k < shortestLength; k++){
				if(firstPrimer.charAt(k) === secondPrimer.charAt(k)){
					similarBases++;
				}
			}

			if(similarBases >= limit){
				matches.push({
					primer: primers[i],
					match: primers[j],
					similarBases: similarBases
				});
			}
		}
	}

	return matches;
}

function convertToCSV(json) {
	const headerKeys = Object.keys(json[0]);
	const convertOptions = { headerKeys };

	try {
		const csv = json2csv(json, convertOptions);
		return csv;
	} catch (err) {
		console.error(err);
		return null;
	}
}

function writeCsvToFile(csv, path, filename){
	fs.writeFile(path + filename, csv, err => {
		if(err) {
			console.log(err);
		}
	
		console.log(path + filename + " was saved!");
	}); 
}