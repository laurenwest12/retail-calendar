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

Date.prototype.getWeekNumber = function () {
	var d = new Date(
		Date.UTC(this.getFullYear(), this.getMonth(), this.getDate())
	);
	var dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
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

const getRetailCalendarWeeks = (arr) => {
	for (let i = 0; i < arr.length; ++i) {
		let retailCalendar = [];
		let { start, year, weeks } = arr[i];
		let months;

		if (weeks === 52) {
			months = [4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5, 4];
		} else {
			months = [4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5, 5];
		}

		let currentRetailWeek = 1;

		for (let i = 0; i < months.length; ++i) {
			let endWeek = months[i];

			for (let j = 1; j <= endWeek; ++j) {
				let end = formatDate(new Date(start).addDays(7));

				retailCalendar.push({
					start,
					end,
					year,
					currentRetailWeek,
					currentWeekOfMonth: j,
					currentMonthOfYear: i + 1,
				});

				start = formatDate(new Date(end).addDays(2));
				currentRetailWeek++;
			}
		}

		return retailCalendar;
	}
};

const getRetailCalendarDates = (calendar) => {
	let dates = [];
	for (let i = 0; i < calendar.length; ++i) {
		const week = calendar[i];
		for (let i = 0; i < 7; ++i) {
			const {
				start,
				end,
				year,
				currentRetailWeek,
				currentWeekOfMonth,
				currentMonthOfYear,
			} = week;
			const date = formatDate(new Date(start).addDays(i + 1));
			dates.push({
				date,
				start,
				end,
				year,
				currentRetailWeek,
				currentWeekOfMonth,
				currentMonthOfYear,
			});
		}
	}
	return dates;
};

app.listen(5000, async () => {
	console.log('App is running');
	const dates = [
		{
			start: '2020-02-02',
			year: '2020',
			weeks: 52,
		},
		{
			start: '2021-01-31',
			year: '2021',
			weeks: 52,
		},
		,
		{
			start: '2022-01-30',
			year: '2022',
			weeks: 52,
		},
		{
			start: '2023-01-29',
			year: '2023',
			weeks: 53,
		},
		{
			start: '2024-02-04',
			year: '2024',
			weeks: 52,
		},
	];

	const retailCalendarWeeks = getRetailCalendarWeeks(dates);
	const retailCalendarDates = getRetailCalendarDates(retailCalendarWeeks);

	console.log('Finished importing');
});
