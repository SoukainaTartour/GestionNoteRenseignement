const express = require("express");
const app = express();
const cors = require("cors");

//middleware

app.use(cors());
app.use(express.json());
const pool = require ("./db");

//routes

app.get("/demandeurinfos", async (req, res) => {
  try {
    const allDemandeurs = await pool.query("SELECT * FROM demandeursInfos");
    res.json(allDemandeurs.rows);
  } catch (err) {
    console.error(err.message);
  }
});


app.post("/demandeurinfos", async (req, res) => {
  try {
    const { nom } = req.body;
    const { adresse } = req.body;
    const { np } = req.body;
    const { ref } = req.body;
    const { dateDemande } = req.body;
    const demandeur = await pool.query(
      "INSERT INTO demandeurinfos (nom, adresse, numero_payement, reference_nr, date_demande) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [nom, adresse, np, ref, dateDemande]
    );

    res.json(demandeur.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/nr", async (req, res) => {
  try {
    const allTodos = await pool.query("SELECT * FROM nr");
    res.json(allTodos.rows);
  } catch (err) {
    console.error(err.message);
  }
});





app.post("/nr", async (req, res) => {
  try {
    const { geom } = req.body;
    const newPoly = await pool.query(
     "INSERT INTO nr (geom) VALUES(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))  RETURNING *",
     
     [geom]
  );
  res.json(newPoly.rows[0]);
   
  } catch (err) {
    console.error(err.message);
  }
});

//GET all infos about nr
app.get("/nrinfos", async (req, res) => {
  try {
    const infos = await pool.query("SELECT * from nrInfos");
    res.json(infos.rows);
  } catch (err) {
    console.error(err.message);
  }
});





//Insert infos in final table : nrInfos 

app.post("/nrInfos", async (req, res) => {
    try {
      
      
      const newPoly = await pool.query(
       "INSERT INTO nrInfos (nom_demandeur, num_demandeur, email_demandeur, adresse_demandeur, societe_demandeur, reference, numero_payement, etat, zonage, voirie, autres, commune, province, date_demande, date_traitement, geom) VALUES((SELECT demandeurInfos.nom FROM demandeurInfos ORDER BY demandeur_id DESC LIMIT 1), (SELECT demandeurInfos.num FROM demandeurInfos ORDER BY demandeur_id DESC LIMIT 1),  (SELECT demandeurInfos.email FROM demandeurInfos ORDER BY demandeur_id DESC LIMIT 1), (SELECT demandeurInfos.adresse FROM demandeurInfos ORDER BY demandeur_id DESC LIMIT 1), (SELECT demandeurInfos.societe FROM demandeurInfos ORDER BY demandeur_id DESC LIMIT 1), (SELECT demandeurInfos.reference_nr FROM demandeurInfos ORDER BY demandeur_id DESC LIMIT 1), (SELECT demandeurInfos.numero_payement FROM demandeurInfos ORDER BY demandeur_id DESC LIMIT 1),  '' , (SELECT string_agg(DISTINCT zonage.code, ', ') FROM nr, zonage WHERE ST_Intersects(ST_MakeValid(zonage.geom),ST_MakeValid(nr.geom)) GROUP BY nr.nr_id ORDER BY nr.nr_id DESC LIMIT 1), (SELECT string_agg(DISTINCT voirie.nom, ', ') FROM nr, voirie WHERE ST_Intersects(ST_MakeValid(voirie.geom),ST_MakeValid(nr.geom)) GROUP BY nr.nr_id ORDER BY nr.nr_id DESC LIMIT 1), (SELECT string_agg(DISTINCT commune.nom_commun, ', ') FROM nr, commune WHERE ST_Intersects(ST_MakeValid(commune.geom),ST_MakeValid(nr.geom)) GROUP BY nr.nr_id ORDER BY nr.nr_id DESC LIMIT 1), (SELECT string_agg(DISTINCT province.nom_provin, ', ') FROM nr, province WHERE ST_Intersects(ST_MakeValid(province.geom),ST_MakeValid(nr.geom)) GROUP BY nr.nr_id ORDER BY nr.nr_id DESC LIMIT 1), current_timestamp, (SELECT ST_SetSRID(ST_AsText(nr.geom), 4326) FROM nr ORDER BY nr.nr_id DESC LIMIT 1)) RETURNING *",
       
       
    );
    res.json(newPoly.rows[0]);
     
    } catch (err) {
      console.error(err.message);
    }
  });



  //Get nom demandeur
app.get("/nom", async (req, res) => {
  try {
    const nom = await pool.query("SELECT nom from demandeurInfos ORDER BY demandeur_id DESC LIMIT 1");
    res.json(nom.rows);
  } catch (err) {
    console.error(err.message);
  }
});
//GET nr référence

app.get("/rf", async (req, res) => {
  try {
    const rf = await pool.query("SELECT reference_nr from demandeurInfos ORDER BY demandeur_id DESC LIMIT 1");
    res.json(rf.rows);
  } catch (err) {
    console.error(err.message);
  }
});

//GET nr commune

app.get("/com", async (req, res) => {
  try {
    const com = await pool.query("SELECT string_agg(DISTINCT commune.nom_commun, ', ') AS commune FROM nr, commune WHERE ST_Intersects(ST_MakeValid(commune.geom),ST_MakeValid(nr.geom)) GROUP BY nr.nr_id ORDER BY nr.nr_id DESC LIMIT 1");
    res.json(com.rows);
  } catch (err) {
    console.error(err.message);
  }
});


//GET nr province
app.get("/pv", async (req, res) => {
  try {
    const pv = await pool.query("SELECT string_agg(DISTINCT province.nom_provin, ', ') AS province FROM nr, province WHERE ST_Intersects(ST_MakeValid(province.geom),ST_MakeValid(nr.geom)) GROUP BY nr.nr_id ORDER BY nr.nr_id DESC LIMIT 1");
    res.json(pv.rows);
  } catch (err) {
    console.error(err.message);
  }
});

//GET nr zonage
app.get("/zn", async (req, res) => {
  try {
    const zn = await pool.query("SELECT string_agg(DISTINCT zonage.code, ', ') AS zonage_code FROM nr, zonage WHERE ST_Intersects(ST_MakeValid(zonage.geom),ST_MakeValid(nr.geom)) GROUP BY nr.nr_id ORDER BY nr.nr_id DESC LIMIT 1");
    res.json(zn.rows);
  } catch (err) {
    console.error(err.message);
  }
});

//GET nr voirie
app.get("/vr", async (req, res) => {
  try {
    const vr = await pool.query("SELECT string_agg(DISTINCT voirie.nom, ', ') AS voirie FROM nr, voirie WHERE ST_Intersects(ST_MakeValid(voirie.geom),ST_MakeValid(nr.geom)) GROUP BY nr.nr_id ORDER BY nr.nr_id DESC LIMIT 1");
    res.json(vr.rows);
  } catch (err) {
    console.error(err.message);
  }
});

//GET nr voirie
app.get("/datedemande", async (req, res) => {
  try {
    const date = await pool.query("SELECT date_demande from demandeurInfos ORDER BY demandeur_id DESC LIMIT 1");
    res.json(date.rows);
  } catch (err) {
    console.error(err.message);
  }
});














app.use("/authentication", require("./routes/jwtAuth"));

app.use("/dashboard", require("./routes/dashboard"));

app.listen(5000, () => {
  console.log(`Server is starting on port 5000`);
});