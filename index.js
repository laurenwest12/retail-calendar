const e = require('express');
const express = require('express');
const app = express();
const sql = require('msnodesqlv8');
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
	minTime: 300,
});

const { server, database, driver } = require('./config');
const connectionString = `server=${server};Database=${database};Trusted_Connection=Yes;Driver=${driver}`;

const {
	WeekCalculation,
	WeekGrouping,
	LastDayOfWeek,
	LastMonthOfYear,
	RetailCalendarFactory,
} = require('retail-calendar');

Date.prototype.addDays = function (days) {
	var date = new Date(this.valueOf());
	date.setDate(date.getDate() + days);
	return date;
};

const getDates = (startDate, stopDate) => {
	const dateArray = new Array();
	let currentDate = startDate;
	while (currentDate <= stopDate) {
		dateArray.push(new Date(currentDate));
		currentDate = currentDate.addDays(1);
	}
	return dateArray;
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

const changeCalendar = (calendar, day) => {
	if (day < calendar.firstDayOfYear) {
		calendar = new RetailCalendarFactory(
			{
				weekCalculation: WeekCalculation.LastDayNearestEOM,
				weekGrouping: WeekGrouping.Group454,
				lastDayOfWeek: LastDayOfWeek.Saturday,
				lastMonthOfYear: LastMonthOfYear.January,
				restated: false,
			},
			day.getFullYear() - 1
		);
	}
};

const getCalendar = (day) => {
	let calendar = new RetailCalendarFactory(
		{
			weekCalculation: WeekCalculation.LastDayNearestEOM,
			weekGrouping: WeekGrouping.Group454,
			lastDayOfWeek: LastDayOfWeek.Saturday,
			lastMonthOfYear: LastMonthOfYear.January,
			restated: false,
		},
		day.getFullYear()
	);

	if (day < calendar.firstDayOfYear) {
		calendar = new RetailCalendarFactory(
			{
				weekCalculation: WeekCalculation.LastDayNearestEOM,
				weekGrouping: WeekGrouping.Group454,
				lastDayOfWeek: LastDayOfWeek.Saturday,
				lastMonthOfYear: LastMonthOfYear.January,
				restated: false,
			},
			day.getFullYear() - 1
		);
	}

	return calendar;
};

const getWeek = (calendar, day) => {
	let months = [
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
		'Jan',
	];

	for (let i = 0; i < calendar.weeks.length; ++i) {
		const week = calendar.weeks[i];
		const start = week.gregorianStartDate;
		const end = week.gregorianEndDate;
		if (day > end) {
			continue;
		} else if (day < start) {
			break;
		} else {
			return {
				date: formatDate(day),
				year: calendar.year,
				month: !months[week.monthOfYear - 1]
					? 'Jan'
					: months[week.monthOfYear - 1],
				week: !week.weekOfMonth + 1 ? 5 : week.weekOfMonth + 1,
			};
		}
	}
};

app.listen(5000, async () => {
	console.log('App is running');
	const dates = getDates(new Date('2015-01-01'), new Date('2050-12-31'));
	for (i in dates) {
		const date = dates[i];
		const calendar = getCalendar(date);
		const week = getWeek(calendar, date);

		await limiter.schedule(async () => {
			const query = `INSERT INTO RetailCalendar VALUES ('${week.date}','${week.year}','${week.month}','${week.week}')`;
			await sql.query(connectionString, query, (err, row) => {
				if (err) console.log(err);
			});
		});
	}
	console.log('Finished importing');
});
