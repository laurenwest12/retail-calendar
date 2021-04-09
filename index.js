const e = require('express');
const express = require('express');
const app = express();
const sql = require('msnodesqlv8');

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
		'Jan',
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
				month: months[week.monthOfYear],
				week: week.weekOfMonth + 1,
			};
		}
	}
};

const getValues = (obj) => {
	let values = `'${obj.date}','${obj.year}','${obj.month}','${obj.week}'`;
};

const submitQuery = async (obj) => {
	const query = `INSERT INTO RetailCalendar VALUES ('${obj.date}','${obj.year}','${obj.month}','${obj.week}')`;
	await sql.query(connectionString, query, (err) => {
		console.log(err);
	});
};

app.listen(5000, () => {
	console.log('App is running');
	const dates = getDates(new Date('2010-01-01'), new Date('2099-12-31'));
	dates.map(async (date) => {
		const calendar = getCalendar(date);
		const week = getWeek(calendar, date);
		await submitQuery(week);
	});
});
