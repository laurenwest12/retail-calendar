const express = require('express');
const app = express();
const sql = require('msnodesqlv8');
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
	minTime: 300,
});

const { server, database, driver } = require('./config');
const connectionString = `server=${server};Database=${database};Trusted_Connection=Yes;Driver=${driver}`;

Date.prototype.addDays = function (days) {
	var date = new Date(this.valueOf());
	date.setDate(date.getDate() + days);
	return date;
};

const formatDate = (date) => {
	let d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear();

	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;

	return [year, month, day].join('-');
};

const getRetailCalendar = (arr) => {
	for (let i = 0; i < arr.length; ++i) {
		let retailCalendar = [];
		let { start, year, weeks } = arr[i];

		let currentRetailWeek = 1;
		let currentRetailMonth = 1;
		let currentMonthNumber = 4;

		for (let i = 1; i <= weeks; ++i) {
			let end = formatDate(new Date(start).addDays(7));

			retailCalendar.push({
				start,
				end,
				year,
				currentRetailWeek,
			});

			start = formatDate(new Date(end).addDays(2));
			currentRetailWeek += 1;
		}

		console.log(retailCalendar);
	}
};

app.listen(5000, async () => {
	console.log('App is running');
	const dates = [
		{
			start: '2021-01-31',
			year: '2021',
			weeks: 52,
		},
		// ,
		// {
		// 	start: '2022-01-30',
		// 	year: '2022',
		// 	weeks: 52,
		// },
		// {
		// 	start: '2023-01-29',
		// 	year: '2023',
		// 	weeks: 53,
		// },
	];

	getRetailCalendar(dates);

	console.log('Finished importing');
});
