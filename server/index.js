const express = require("express");
const app = express();

const fs = require("fs");
const cors = require('cors');

const pool = require ("./db");


//middleware
app.use(cors());
app.use(express.json());
//ADD



//ROUTES 
//Add user infos in userInfos table
app.post("/userinfos", async (req, res) => {
    try {
      const { nom } = req.body;
      const { rf } = req.body;
      const { np } = req.body;
      const newTodo = await pool.query(
        "INSERT INTO userInfos (nom, rf, np) VALUES($1, $2, $3) RETURNING *",
        [nom, rf, np]
      );
  
      res.json(newTodo.rows[0]);
    } catch (err) {
      console.error(err.message);
    }
  });

  // Add demandeur infos in demandeurinfos table
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

  

//Insert drawn or from coordinates nr in nr table

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


// GET drawn or inserted from coordinates nr 

app.get("/nr", async (req, res) => {
  try {
    const allTodos = await pool.query("SELECT * FROM nr");
    res.json(allTodos.rows);
  } catch (err) {
    console.error(err.message);
  }
});

// GET nr intersection with plan autocad aklim in string 64 format
app.get("/image", async (req, res) => {
  try {
    const image = await pool.query("WITH enveloppe as (SELECT ST_Envelope(ST_Union(pa_autocad_aklim.rast)) as en FROM pa_autocad_aklim, nrs WHERE nrs.nrs_id = (SELECT nrs_id FROM nrs ORDER BY nrs_id DESC LIMIT 1) AND ST_Intersects(pa_autocad_aklim.rast, ST_MakeValid(nrs.polygon))), diff as (SELECT ST_Union(ST_Difference(en, ST_MakeValid(nrs.polygon))) as dif FROM enveloppe, nrs WHERE nrs.nrs_id = (SELECT nrs_id FROM nrs ORDER BY nrs_id DESC LIMIT 1)) SELECT encode(ST_AsPNG(ST_ColorMap(ST_Clip(ST_Union(pa_autocad_aklim.rast), dif),'greyscale')), 'base64') FROM pa_autocad_aklim, diff GROUP BY diff.dif");
    res.json(image.rows);
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
       "INSERT INTO nrInfos (nom, num, adresse, email, societe, np, rf, etat, zonage, voirie, commune, province, date_demande, nr) VALUES((SELECT userInfos.nom FROM userInfos ORDER BY user_id DESC LIMIT 1), (SELECT userInfos.num FROM userInfos ORDER BY user_id DESC LIMIT 1), (SELECT userInfos.adresse FROM userInfos ORDER BY user_id DESC LIMIT 1), (SELECT userInfos.email FROM userInfos ORDER BY user_id DESC LIMIT 1), (SELECT userInfos.societe FROM userInfos ORDER BY user_id DESC LIMIT 1), (SELECT userInfos.np FROM userInfos ORDER BY user_id DESC LIMIT 1), (SELECT userInfos.rf FROM userInfos ORDER BY user_id DESC LIMIT 1), (SELECT nrAklim.etat FROM nrAklim ORDER BY nr_id DESC LIMIT 1), (SELECT string_agg(DISTINCT zonage.code, ', ') FROM nrAklim, zonage WHERE ST_Intersects(ST_MakeValid(zonage.geom),ST_MakeValid(nrAklim.nr)) GROUP BY nrAklim.nr_id ORDER BY nrAklim.nr_id DESC LIMIT 1), (SELECT string_agg(DISTINCT voirie.nom, ', ') FROM nrAklim, voirie WHERE ST_Intersects(ST_MakeValid(voirie.geom),ST_MakeValid(nrAklim.nr)) GROUP BY nrAklim.nr_id ORDER BY nrAklim.nr_id DESC LIMIT 1), (SELECT string_agg(DISTINCT commune.nom_commun, ', ') FROM nrAklim, commune WHERE ST_Intersects(ST_MakeValid(commune.geom),ST_MakeValid(nrAklim.nr)) GROUP BY nrAklim.nr_id ORDER BY nrAklim.nr_id DESC LIMIT 1), (SELECT string_agg(DISTINCT province.nom_provin, ', ') FROM nrAklim, province WHERE ST_Intersects(ST_MakeValid(province.geom),ST_MakeValid(nrAklim.nr)) GROUP BY nrAklim.nr_id ORDER BY nrAklim.nr_id DESC LIMIT 1), current_timestamp, (SELECT ST_SetSRID(ST_AsText(nrAklim.nr), 4326) FROM nrAklim ORDER BY nrAklim.nr_id DESC LIMIT 1)) RETURNING *",
       
       
    );
    res.json(newPoly.rows[0]);
     
    } catch (err) {
      console.error(err.message);
    }
  });
//Get nom demandeur
app.get("/nom", async (req, res) => {
  try {
    const nom = await pool.query("SELECT nom_demandeur from nrInfos ORDER BY nrInfos_id DESC LIMIT 1");
    res.json(nom.rows);
  } catch (err) {
    console.error(err.message);
  }
});
//GET nr référence

app.get("/rf", async (req, res) => {
  try {
    const rf = await pool.query("SELECT reference from nrInfos ORDER BY nrInfos_id DESC LIMIT 1");
    res.json(rf.rows);
  } catch (err) {
    console.error(err.message);
  }
});

//GET nr commune

app.get("/com", async (req, res) => {
  try {
    const com = await pool.query("SELECT commune from nrInfos ORDER BY nrInfos_id DESC LIMIT 1");
    res.json(com.rows);
  } catch (err) {
    console.error(err.message);
  }
});


//GET nr province
app.get("/pv", async (req, res) => {
  try {
    const pv = await pool.query("SELECT province from nrInfos ORDER BY nrInfos_id DESC LIMIT 1");
    res.json(pv.rows);
  } catch (err) {
    console.error(err.message);
  }
});

//GET nr zonage
app.get("/zn", async (req, res) => {
  try {
    const zn = await pool.query("SELECT zonage from nrInfos ORDER BY nrInfos_id DESC LIMIT 1");
    res.json(zn.rows);
  } catch (err) {
    console.error(err.message);
  }
});

//GET nr voirie
app.get("/vr", async (req, res) => {
  try {
    const vr = await pool.query("SELECT voirie from nrInfos ORDER BY nrInfos_id DESC LIMIT 1");
    res.json(vr.rows);
  } catch (err) {
    console.error(err.message);
  }
});

//GET nr voirie
app.get("/datedemande", async (req, res) => {
  try {
    const date = await pool.query("SELECT date_demande from nrInfos ORDER BY nrInfos_id DESC LIMIT 1");
    res.json(date.rows);
  } catch (err) {
    console.error(err.message);
  }
});









//get a todo
app.get("/todos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const todo = await pool.query("SELECT * FROM todo WHERE todo_id = $1", [
        id
      ]);
  
      res.json(todo.rows[0]);
    } catch (err) {
      console.error(err.message);
    }
  });
  

//update a todo
app.put("/todos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { description } = req.body;
      const updateTodo = await pool.query(
        "UPDATE todo SET description = $1 WHERE todo_id = $2",
        [description, id]
      );
  
      res.json("Todo was updated!");
    } catch (err) {
      console.error(err.message);
    }
  });
//UPDATE AND INSERT IN POLYGON TABLE 
  app.put("/nrs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { polygon } = req.body;
  
      const updateNr = await pool.query(
        "UPDATE nrs, nom = todo.description FROM todo WHERE nrs.nr_id = todo.todo_id",
       
        [polygon, id]
      );
  
      res.json("Todo was updated!");
    } catch (err) {
      console.error(err.message);
    }
  });

//delete a todo
app.delete("/todos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleteTodo = await pool.query("DELETE FROM todo WHERE todo_id = $1", [
        id
      ]);
      res.json("Todo was deleted!");
    } catch (err) {
      console.log(err.message);
    }
  });



app.listen(5000, () => {
console.log("server is running on port 5000");
});