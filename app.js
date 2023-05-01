const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbpath = path.join(__dirname, "covid19India.db");
let db = null;

const hlo = async () => {
  try {
    db = await open({ filename: dbpath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

hlo();

const convert = (msg) => {
  return {
    stateId: msg.state_id,
    stateName: msg.state_name,
    population: msg.population,
  };
};

const converdist = (msg) => {
  return {
    districtId: msg.district_id,
    districtName: msg.district_name,
    stateId: msg.state_id,
    cases: msg.cases,
    cured: msg.cured,
    active: msg.active,
    deaths: msg.deaths,
  };
};

//get
app.get("/states/", async (request, response) => {
  const query = `SELECT * FROM state;`;
  const res = await db.all(query);
  response.send(res.map(convert));
});

//get based on state Id
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query = `SELECT * FROM state WHERE state_id=${stateId};`;
  const res = await db.get(query);
  response.send(convert(res));
});

//post
app.post("/districts/", async (request, response) => {
  const districts = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districts;
  const query = `INSERT INTO district
  ("district_name","state_id","cases","cured","active","deaths")
  VALUES ("${districtName}",${stateId},${cases},${cured},${active},
  ${deaths});`;
  await db.run(query);
  response.send("District Successfully Added");
});

//get district Id
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `SELECT * FROM district WHERE
    district_id=${districtId};`;
  const res = await db.get(query);
  response.send(converdist(res));
});

//delete
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `DELETE FROM district
    WHERE district_id=${districtId};`;
  await db.run(query);
  response.send("District Removed");
});

//Put
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const update = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = update;
  const query = `UPDATE district SET
    district_name="${districtName}",state_id=${stateId},cases=${cases},
    cured=${cured},active=${active},deaths=${deaths};`;
  await db.run(query);
  response.send("District Details Updated");
});

//get total cases
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `SELECT SUM(cases) as totalCases, SUM(cured) as totalCured,
    SUM(active) as totalActive, SUM(deaths) as totalDeaths FROM district 
    WHERE state_id=${stateId};`;
  const res = await db.get(query);
  response.send(res);
});

// get state name
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const query = `SELECT state_name as stateName FROM
    state INNER JOIN district ON state.state_id=district.state_id 
    WHERE district_id=${districtId};`;
  const res = await db.get(query);
  response.send(res);
});

module.exports = app;
