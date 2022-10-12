const puppet = require('puppeteer');
const fs = require('fs/promises');
const { hasSubscribers } = require('diagnostics_channel');
require('dotenv').config();

async function start() {
    let url = await getUrl();
    const browser = await puppet.launch();
    const page = await browser.newPage();
    await page.goto(url);

    const finalArray = await getInformation(page);
    // await getInformation1(page);
    // https://www.espn.com/mlb/schedule/_/date/20220904

    // await extractScheduledGames(page);
    await page.screenshot({ path: "MLB_Schedule.png", fullPage: true});
    await insertData(finalArray);
    await browser.close();
}

async function extractScheduledGames(page) {
    
    let gamesEnded = checkArray(page);
    let scheduledGameInformation;
    let finalGames = [];

    if(gamesEnded) {
        scheduledGameInformation = await page.evaluate(() => {     
           return Array.from(document.querySelectorAll("#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) .AnchorLink")).map(x => x.textContent);    
    })
    finalGames =  await extractFinalGames(page);
}
    else {
        scheduledGameInformation = await page.evaluate(() => {     
           return Array.from(document.querySelectorAll("#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(3) > div:nth-child(1) > div .AnchorLink")).map(x => x.textContent);    
    })
}
    
    for(let i = 0; i < scheduledGameInformation.length; i++) {
        if(scheduledGameInformation[i].length < 1) {
            scheduledGameInformation.splice(i, 1);
        }
       // console.log(scheduledGameInformation[i]);
    }

    let parser = false;
    let schedGames = [];
    let liveGames = [];
    let scheduledGamesObjects = [];
    let liveGameObjects = [];
    let totalGames = [];

    for(let i = 0; i < scheduledGameInformation.length; i++) {
        if(parser == false) {
            liveGames.push(scheduledGameInformation[i]);
        }
        if(scheduledGameInformation[i].match(/^\d/) && parser == false) {
            parser = true;
            live = false;
            i -= 2;
        }
        if(parser == true) {
            schedGames.push(scheduledGameInformation[i]);
        }
    }

    liveGames.pop();
    liveGames.pop();
    liveGames.pop();

    for(let i = 0; i < schedGames.length; i += 6) {
        let game = {
            away_team: schedGames[i],
            home_team: schedGames[i + 1],
            time: schedGames[i + 2],
            home_pitcher: schedGames[i + 3],
            away_pitcher: schedGames[i + 4],
            ticket_cheapest_price: schedGames[i + 5]
        }
        scheduledGamesObjects.push(game);
    }

    for(let i = 0; i < liveGames.length; i += 4) {
        let game = {
            away_team: liveGames[i], 
            home_team: liveGames[i+1],
            time: 'Live',
            home_pitcher: liveGames[i + 2],
            away_pitcher: liveGames[i + 3]
        }
        liveGameObjects.push(game);
    }

    totalGames = [liveGameObjects, scheduledGamesObjects, finalGames];

    for(let i = 0; i < totalGames.length; i++) {
       // console.log(totalGames[i]);
    }

    await fs.writeFile("names.txt", scheduledGamesObjects.join("\r\n"));
    return totalGames;
}

async function checkArray(page) {
    const scheduledGameInformation = await page.evaluate(() => {     
        return Array.from(document.querySelectorAll("#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) .AnchorLink")).map(x => x.textContent);    
 })
 
    let gamesEnded = false;

    if(scheduledGameInformation.length > 0) {
        gamesEnded = true;
    }
    else { gamesEnded = false; }

    return gamesEnded;
}

async function extractFinalGames(page) {
    const finalGameInformation = await page.evaluate(() => {     
        return Array.from(document.querySelectorAll("#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(3) > div:nth-child(1) > div:nth-child(2) > div > div > div.Table__Scroller > table .AnchorLink")).map(x => x.textContent);    
 })

    for(let i = 0; i < finalGameInformation.length; i++){
        if(finalGameInformation[i].length < 1) {
            finalGameInformation.splice(i, 1);
        }      
    }

    let finalGames = [];

    for(let i = 0; i < finalGameInformation.length; i+= 6) {
        let game = {
            away_team: finalGameInformation[i],
            home_team: finalGameInformation[i + 1],
            result: finalGameInformation[i + 2],
            winning_pitcher: finalGameInformation[i + 3],
            losing_pitcher: finalGameInformation[i + 4],
            recorded_save: finalGameInformation[i + 5]
        }
        finalGames.push(game);
    }

    for(let i = 0; i < finalGames.length; i++) {
        //console.log(finalGames[i]);
    }
 
}

async function getUrl () {

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    today = yyyy + mm + dd;

    let urlTemp = 'https://www.espn.com/mlb/schedule/_/date/';
    let url = urlTemp.concat(today);
    await console.log(url);

    return url;

}

async function getInformation (page) {
    const gameInfo = await page.evaluate(() => {     
        return Array.from(document.querySelectorAll("#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(4) > div:nth-child(1) > div:nth-child(1) > div.flex > div > div.Table__Scroller > table > tbody > tr")).map(x => x.textContent);    
 })

 let gameObjectsArr = [];
 let numGames = -1;
 let counter = 0;

 for(let i = 0; i < gameInfo.length; i++) {

    let gameObject = {
        home_team: null,
        away_team: null,
        time: null,
        home_pitcher: null,
        away_pitcher: null,
        tickets: null,
     };

    let away_team_string = "#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(4) > div:nth-child(1) > div:nth-child(1) > div.flex > div > div.Table__Scroller > table > tbody > tr[data-idx=" + "'" + counter + "'" + "] > td.events__col.Table__TD > div.matchTeams";
    let home_team_string = "#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(4) > div:nth-child(1) > div:nth-child(1) > div.flex > div > div.Table__Scroller > table > tbody > tr[data-idx=" + "'" + counter + "'" + "] > td.colspan__col.Table__TD > div > span.Table__Team > a:nth-child(2)";
    let time_string = "#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(4) > div:nth-child(1) > div:nth-child(1) > div.flex > div > div.Table__Scroller > table > tbody > tr[data-idx=" + "'" + counter + "'" + "] > td.date__col.Table__TD";
    // let tv_provider_string = "#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div.flex > div > div.Table__Scroller > table > tbody > tr[data-idx=" + "'" + counter + "'" + "] > td.broadcast__col.Table__TD";
    // let pitching_matchup_string = "#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div.flex > div > div.Table__Scroller > table > tbody > tr[data-idx=" + "'" + counter + "'" + "] > td.probable__col.Table__TD";
    let home_pitcher_string = "#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(4) > div:nth-child(1) > div > div.flex > div > div.Table__Scroller > table > tbody > tr[data-idx=" + "'" + counter + "'" + "] > td.probable__col.Table__TD > p > a:nth-child(3)";
    let away_pitcher_string = "#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(4) > div:nth-child(1) > div > div.flex > div > div.Table__Scroller > table > tbody > tr[data-idx=" + "'" + counter + "'" + "] > td.probable__col.Table__TD > p > a:nth-child(1)";
    let tickets_string = "#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(4) > div:nth-child(1) > div:nth-child(1) > div.flex > div > div.Table__Scroller > table > tbody > tr[data-idx=" + "'" + counter + "'" + "] > td.tickets__col.Table__TD";

    counter++;

    gameObject.away_team = await page.evaluate((away_team_string) => {
        return Array.from(document.querySelectorAll(away_team_string)).map(x => x.textContent);    
}, away_team_string)

    gameObject.home_team = await page.evaluate((home_team_string) => {
        return Array.from(document.querySelectorAll(home_team_string)).map(x => x.textContent);    
}, home_team_string)

    gameObject.time = await page.evaluate((time_string) => {
        return Array.from(document.querySelectorAll(time_string)).map(x => x.textContent);    
}, time_string)

    gameObject.home_pitcher = await page.evaluate((home_pitcher_string) => {
        return Array.from(document.querySelectorAll(home_pitcher_string)).map(x => x.textContent);    
}, home_pitcher_string)

    gameObject.away_pitcher = await page.evaluate((away_pitcher_string) => {
        return Array.from(document.querySelectorAll(away_pitcher_string)).map(x => x.textContent);    
}, away_pitcher_string)

    gameObject.tickets = await page.evaluate((tickets_string) => {
        return Array.from(document.querySelectorAll(tickets_string)).map(x => x.textContent);    
}, tickets_string)

   gameObjectsArr.push(gameObject);
 }
   
    gameObjectsArr = arrayCleanup(gameObjectsArr);

    return gameObjectsArr;
}

function insertData(finalArray) {
    
    const mysql = require("mysql")

    const db = mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });

    console.log(finalArray[0].home_team);

    db.connect((err) => {
        if(err) {
            console.log(err.message);
            return;
        }
        db.query("DELETE FROM theTable");

        for(let i = 0; i < finalArray.length; i++) {
    
        db.query("INSERT iNTO theTable(home_team, away_team, time, home_pitcher, away_pitcher, tickets) VALUES ('" + finalArray[i].home_team + "','" + finalArray[i].away_team + "','" + finalArray[i].time + "','" + finalArray[i].home_pitcher + "','" + finalArray[i].away_pitcher + "','" + finalArray[i].tickets + "')");
        
        }
        db.destroy();

    });

}

async function arrayCleanup(gameObjectsArr) {


    if(typeof(gameObjectsArr[0].tickets[0]) == 'undefined') {
        gameObjectsArr = [];
        return gameObjectsArr;
    }
    else {

    for(let i = 0; i<gameObjectsArr.length; i++) {

       
        gameObjectsArr[i].home_team = gameObjectsArr[i].home_team[0];
        gameObjectsArr[i].away_team = gameObjectsArr[i].away_team[0];
        gameObjectsArr[i].time = gameObjectsArr[i].time[0];
        gameObjectsArr[i].tickets = gameObjectsArr[i].tickets[0];
        gameObjectsArr[i].home_pitcher = gameObjectsArr[i].home_pitcher[0];
        gameObjectsArr[i].away_pitcher = gameObjectsArr[i].away_pitcher[0];


        if(gameObjectsArr[i].tickets == '') {
            gameObjectsArr[i].tickets = 'unavailable';
        }

        if(typeof(gameObjectsArr[i].home_pitcher) == 'undefined' ) {
            gameObjectsArr[i].home_pitcher = "undecided";
        }

        if(typeof(gameObjectsArr[i].away_pitcher) == 'undefined' ) {
            gameObjectsArr[i].away_pitcher = "undecided";
        }


        console.log(gameObjectsArr[i]);
    

    }


    return gameObjectsArr;
}
}

start();

//#fittPageContainer > div:nth-child(3) > div > div > section > div > div:nth-child(3) > div:nth-child(1) > div > div.flex > div > div.Table__Scroller > table > tbody > tr


